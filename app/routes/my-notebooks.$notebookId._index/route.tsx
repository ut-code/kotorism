import { useState } from "react";
import { useFetcher, useSearchParams } from "react-router";

import Link from "@/components/Link";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { recordNotebookView } from "@/lib/server/recent-activity.server";
import { getNotebookRole } from "@/lib/server/notebook-access.server";
import { notFound } from "@/lib/server/http.server";
import InputAssist from "./InputAssist";
import NotebookLanguageSelect from "./NotebookLanguageSelect";
import NotebookTable from "./NotebookTable";
import NotebookTitle from "./NotebookTitle";
import ImportCardsForm from "@/components/my-notebooks/ImportCardsForm";
import ResetAllStarsButton, {
  MENU_ITEM_CLASS,
} from "@/components/my-notebooks/ResetAllStarsButton";
import NotebookMoreMenu from "@/components/my-notebooks/NotebookMoreMenu";
import StarIcon from "@/components/StarIcon";
import EyeIcon from "@/components/EyeIcon";
import ShareNotebookButton from "@/components/my-notebooks/ShareNotebookButton";
import ShareManager from "@/components/my-notebooks/ShareManager";
import { normalizeCardData } from "@/lib/shared/card-data";
import type { FormState } from "@/lib/shared/form-state";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import { normalizeNotebookLanguage } from "@/lib/shared/notebook-language";
import {
  addNotebookColumn,
  addStar,
  createCard,
  deleteCard,
  deleteNotebook,
  deleteNotebookColumn,
  importCardsFromExcel,
  incrementViewCount,
  moveCard,
  moveNotebookColumn,
  renameNotebook,
  recordCardQuizAnswer,
  renameNotebookColumn,
  resetAllStars,
  resetStar,
  setStarCount,
  toggleNotebookPublic,
  toggleStar,
  updateCard,
  updateCards,
  updateNotebookLanguage,
} from "@/lib/server/my-notebooks/actions.server";
import {
  createInvite,
  removeShare,
  revokeInvite,
} from "@/lib/server/my-notebooks/sharing-actions.server";
import type { Route } from "./+types/route";

// ページ内のすべての更新操作(単語・列・共有・★など)はこの action で受け、intent で振り分ける。
// 単語帳の学習ページ(study など)からも、この URL に送信して★や表示回数を更新する。
// 処理後は React Router が自動で loader を再実行するので、手動の再検証は不要
export async function action({ request, params }: Route.ActionArgs) {
  const { notebookId } = params;
  const formData = await request.formData();
  const text = (key: string) => String(formData.get(key) ?? "");

  const result = await (async () => {
    switch (text("intent")) {
      case "createCard":
        return createCard(notebookId, formData);
      case "updateCard":
        return updateCard(text("cardId"), notebookId, formData);
      case "updateCards":
        return updateCards(notebookId, formData);
      case "deleteCard":
        return deleteCard(text("cardId"), notebookId);
      case "toggleStar":
        return toggleStar(text("cardId"), notebookId);
      case "addStar":
        return addStar(text("cardId"), notebookId);
      case "setStarCount":
        return setStarCount(text("cardId"), notebookId, formData);
      case "resetStar":
        return resetStar(text("cardId"), notebookId);
      case "resetAllStars":
        return resetAllStars(notebookId);
      case "incrementViewCount":
        return incrementViewCount(
          text("cardId"),
          notebookId,
          text("mode") === "review" ? "review" : "study",
        );
      case "recordQuizAnswer":
        return recordCardQuizAnswer(text("cardId"), notebookId);
      case "importCards":
        return importCardsFromExcel(notebookId, formData);
      case "addColumn":
        return addNotebookColumn(notebookId, formData);
      case "renameColumn":
        return renameNotebookColumn(notebookId, Number(text("columnIndex")), formData);
      case "deleteColumn":
        return deleteNotebookColumn(notebookId, Number(text("columnIndex")));
      case "moveColumn":
        return moveNotebookColumn(notebookId, formData);
      case "moveCard":
        return moveCard(notebookId, formData);
      case "togglePublic":
        return toggleNotebookPublic(notebookId);
      case "deleteNotebook":
        return deleteNotebook(notebookId);
      case "renameNotebook":
        return renameNotebook(notebookId, formData);
      case "updateLanguage":
        return updateNotebookLanguage(notebookId, formData);
      case "createInvite":
        return createInvite(notebookId);
      case "revokeInvite":
        return revokeInvite(text("inviteId"), notebookId);
      case "removeShare":
        return removeShare(text("shareId"), notebookId);
      default:
        throw new Response("Bad Request", { status: 400 });
    }
  })();
  // React Router の action は undefined を返せないため、戻り値の無い操作は空オブジェクトにする
  return result ?? {};
}

export async function loader({ params }: Route.LoaderArgs) {
  const user = await requireUser();
  const { notebookId } = params;

  // 作成者本人か、共有された共同編集者かを判定する。
  // どちらでもなければ他人の単語帳なので404にする（共同編集者は常に編集可能）
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }

  // 最近見た単語帳としてトップページに出すため、レスポンスを待たずに閲覧日時を記録する
  void recordNotebookView(user.id, notebookId).catch(console.error);
  const isOwner = role === "owner";

  // 単語帳本体と、その中の単語（Card）一覧を position 昇順（＝Excelの元の並び順）で取得する
  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    include: {
      cards: { orderBy: { position: "asc" } },
      user: { select: { name: true } },
    },
  });

  // ★・暗記モード表示回数はユーザーごとに独立しているため、自分の進捗だけを取得してカードにマージする
  const progressRows = await prisma.cardProgress.findMany({
    where: { userId: user.id, card: { notebookId } },
  });
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));

  // オーナーのみ、共有管理パネル（招待リンク・共同編集者一覧）に必要なデータを取得する
  let invites: { id: string; token: string }[] = [];
  let shares: { id: string; user: { name: string } }[] = [];
  if (isOwner) {
    [invites, shares] = await Promise.all([
      prisma.notebookInvite.findMany({
        where: { notebookId },
        orderBy: { createdAt: "desc" },
        select: { id: true, token: true },
      }),
      prisma.notebookShare.findMany({
        where: { notebookId },
        orderBy: { createdAt: "asc" },
        select: { id: true, user: { select: { name: true } } },
      }),
    ]);
  }

  // columns は「1列目=見出し語、2列目以降=意味・発音などの列名」という順序付き配列。
  // 各列の値は見出し語につき1件〜複数件を自由に持てる（列ごとの件数は完全に独立）。
  // 列数・列名はNotebookごとに異なるため、テーブルのヘッダーや各行の入力欄は
  // columns をループして動的に組み立てる
  const columns = normalizeColumns(notebook.columns);
  const cards = notebook.cards.map((card) => {
    const progress = progressByCardId.get(card.id);
    return {
      id: card.id,
      data: normalizeCardData(card.data),
      starred: progress?.starred ?? false,
      starCount: progress?.starCount ?? 0,
      viewCount: progress?.viewCount ?? 0,
    };
  });
  // ★がついている単語の件数。1件以上あれば「復習」への導線を出す
  const starredCount = cards.filter((card) => card.starred).length;
  // ★の回数が1回でも付いている単語があれば「一括リセット」の導線を出す
  const hasAnyStars = cards.some((card) => card.starCount > 0);

  return {
    notebook: {
      id: notebook.id,
      title: notebook.title,
      isPublic: notebook.isPublic,
      language: normalizeNotebookLanguage(notebook.language),
      cardCount: notebook.cards.length,
      // 共同編集者として開いたときに「〇〇さんから共有」と出す、作成者の名前
      ownerName: notebook.user.name,
    },
    isOwner,
    invites,
    shares: shares.map((share) => ({
      id: share.id,
      userName: share.user.name,
    })),
    columns,
    cards,
    starredCount,
    hasAnyStars,
  };
}

// 表をまとめて編集するときに、表の中の入力欄を form 属性で結び付けるフォームのid
const BULK_EDIT_FORM_ID = "bulk-edit-cards";
const noFormState: FormState = {};

export default function NotebookPage({ loaderData }: Route.ComponentProps) {
  const { notebook, isOwner, invites, shares, columns, cards, starredCount, hasAnyStars } =
    loaderData;

  // ホームの「Excelから取り込む」から作った直後（?import=1）は、取り込み欄を開いた状態で始める。
  // ?import=1 はすぐ URL から外す（NotebookTitle）ので、最初の値だけを覚えておく
  const [searchParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(() => searchParams.get("import") === "1");
  // 「共有」で開く欄（リンクでの公開・共同編集者の管理）。作成者だけ
  const [shareOpen, setShareOpen] = useState(false);

  // 「表を編集」を押すと、表のすべてのセルを入力欄にしてまとめて保存できる（intent=updateCards）。
  // 保存に成功したら表示に戻り、入力に問題があれば何も保存せずに理由を表示して編集を続ける
  const [editingAll, setEditingAll] = useState(false);
  const bulkFetcher = useFetcher<FormState>();
  const bulkState = bulkFetcher.data ?? noFormState;
  const savingAll = bulkFetcher.state !== "idle";
  const [prevBulkState, setPrevBulkState] = useState(bulkState);
  if (bulkState !== prevBulkState) {
    setPrevBulkState(bulkState);
    if (!bulkState.error) setEditingAll(false);
  }

  const openImport = () => {
    setImportOpen(true);
    setShareOpen(false);
  };

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-4xl">
        <Link
          href="/my-notebooks"
          className="text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          ← My単語帳一覧
        </Link>

        {/* 主役（学ぶ）はタイトルのすぐ下に大きく、脇役（共有・取り込みなどの管理）は右上の「共有」「⋯」にまとめる */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <NotebookTitle notebookId={notebook.id} title={notebook.title} canEdit={isOwner} />
            <NotebookLanguageSelect
              notebookId={notebook.id}
              language={notebook.language}
              canEdit={isOwner}
            />
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              {notebook.cardCount}語
              {!isOwner && (
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  共同編集者として参加中
                </span>
              )}
            </p>
            {/* 共同編集者として開いたときは、誰から共有された単語帳かを薄く小さい文字で出す */}
            {!isOwner && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {notebook.ownerName}さんから共有
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setShareOpen((prev) => !prev);
                  setImportOpen(false);
                }}
                aria-expanded={shareOpen}
                className="rounded-full border border-black/[.08] px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                共有
              </button>
            )}
            <NotebookMoreMenu>
              <button
                type="button"
                role="menuitem"
                onClick={openImport}
                className={MENU_ITEM_CLASS}
              >
                Excel・スプレッドシートから追加
              </button>
              {hasAnyStars && <ResetAllStarsButton notebookId={notebook.id} variant="menuItem" />}
            </NotebookMoreMenu>
          </div>
        </div>

        {notebook.cardCount > 0 && (
          // スマホなど狭い画面では、ボタンが押しつぶされて文字が折り返さないよう、画面幅いっぱいで1行に1つずつ並べる
          <div className="mt-6 flex flex-col gap-3 text-center sm:flex-row sm:items-center">
            <Link
              href={`/my-notebooks/${notebook.id}/study`}
              className="rounded-full bg-button-notebook px-8 py-3 text-base font-bold whitespace-nowrap text-white transition-all hover:-translate-y-0.5 hover:bg-button-notebook-hover hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
            >
              暗記学習を始める
            </Link>
            <Link
              href={`/my-notebooks/${notebook.id}/quiz`}
              className="rounded-full border-2 border-coral-300 px-8 py-2.5 text-base font-bold whitespace-nowrap text-coral-800 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:shadow-md hover:shadow-coral-100 dark:border-coral-800 dark:text-coral-200 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:shadow-none"
            >
              クイズに挑戦
            </Link>
            {starredCount > 0 && (
              <Link
                href={`/my-notebooks/${notebook.id}/review`}
                className="rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap text-coral-800 underline-offset-4 transition-colors hover:underline dark:text-coral-200"
              >
                ★を復習する（{starredCount}語）
              </Link>
            )}
          </div>
        )}

        {isOwner && shareOpen && (
          <section
            aria-label="共有"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">共有</h2>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-400"
              >
                閉じる
              </button>
            </div>
            <div>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                見るだけ：リンクを知っている人なら、ログインしなくても見て暗記学習・クイズができます。
              </p>
              <ShareNotebookButton notebookId={notebook.id} isPublic={notebook.isPublic} />
            </div>
            <ShareManager notebookId={notebook.id} invites={invites} shares={shares} embedded />
          </section>
        )}

        {/* 表全体の編集中は「保存」「キャンセル」だけを出し、ほかの操作は編集を終えてから行う */}
        {importOpen && !editingAll && (
          <div className="mt-6">
            <ImportCardsForm notebookId={notebook.id} open onOpenChange={setImportOpen} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
          {cards.length > 0 &&
            (editingAll ? (
              <>
                <p className="mr-auto text-xs text-zinc-500 dark:text-zinc-500">
                  見出し語を空けた行は、上の単語の組になります。組のマスを全部空にすると、その組を消します。
                </p>
                <button
                  type="submit"
                  form={BULK_EDIT_FORM_ID}
                  disabled={savingAll}
                  className="rounded-full bg-button-notebook px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-button-notebook-hover disabled:opacity-50"
                >
                  {savingAll ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAll(false)}
                  className="text-sm text-zinc-600 transition-colors hover:underline dark:text-zinc-400"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditingAll(true)}
                aria-label="表を編集"
                className="rounded-full border border-coral-300 px-4 py-1.5 text-sm font-medium text-coral-700 transition-colors hover:border-coral-500 hover:bg-coral-50 dark:border-coral-900/50 dark:text-coral-300 dark:hover:bg-coral-950/20"
              >
                編集
              </button>
            ))}
        </div>

        {/* 表をまとめて編集するときのフォーム。入力欄は表の中にあり、form 属性でこのフォームに結び付く */}
        {editingAll && (
          <bulkFetcher.Form id={BULK_EDIT_FORM_ID} method="post" className="hidden">
            <input type="hidden" name="intent" value="updateCards" />
          </bulkFetcher.Form>
        )}
        {editingAll && bulkState.error && (
          <p role="alert" className="mt-3 text-right text-sm text-red-600 dark:text-red-400">
            {bulkState.error}
          </p>
        )}

        {/* 各単語の見出し語の下の ☆・👁 の数字が何かを、表の上に短く書いておく（PCではマウスを乗せても出る） */}
        {cards.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <StarIcon filled={false} className="h-3.5 w-3.5" />
              ★の数（押すたびに増える）
            </span>
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="h-3.5 w-3.5" />
              見た回数（暗記学習で表示した回数）
            </span>
          </p>
        )}

        {/* 単語帳の言語に合わせた、表の入力欄の入力補助（アクセント記号・ピンイン） */}
        <InputAssist notebookId={notebook.id} language={notebook.language}>
          <NotebookTable
            notebookId={notebook.id}
            columns={columns}
            cards={cards}
            bulkEditFormId={editingAll ? BULK_EDIT_FORM_ID : undefined}
            onRequestImport={openImport}
          />
        </InputAssist>
      </div>
    </main>
  );
}
