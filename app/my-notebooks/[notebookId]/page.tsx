import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getNotebookRole } from "@/lib/notebook-access";
import CardRow from "./CardRow";
import CreateCardForm from "./CreateCardForm";
import ColumnsEditor from "@/components/my-notebooks/ColumnsEditor";
import ImportCardsForm from "@/components/my-notebooks/ImportCardsForm";
import ResetAllStarsButton from "@/components/my-notebooks/ResetAllStarsButton";
import ShareNotebookButton from "@/components/my-notebooks/ShareNotebookButton";
import ShareManager from "@/components/my-notebooks/ShareManager";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";

// DBの最新状態を常に表示するため、ビルド時の静的プリレンダリングを避けてリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function NotebookPage(props: PageProps<"/my-notebooks/[notebookId]">) {
  const user = await requireUser();
  const { notebookId } = await props.params;

  // 作成者本人か、共有された共同編集者かを判定する。
  // どちらでもなければ他人の単語帳なので404にする（共同編集者は常に編集可能）
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }
  const isOwner = role === "owner";

  // 単語帳本体と、その中の単語（Card）一覧を position 昇順（＝Excelの元の並び順）で取得する
  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  // ★・暗記モード表示回数はユーザーごとに独立しているため、自分の進捗だけを取得してカードにマージする
  const progressRows = await prisma.cardProgress.findMany({
    where: { userId: user.id, card: { notebookId } },
  });
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));

  // オーナーのみ、共有管理パネル（招待リンク・共同編集者一覧）に必要なデータを取得する
  let invites: { id: string; token: string }[] = [];
  let shares: { id: string; user: { name: string; username: string | null } }[] = [];
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
        select: { id: true, user: { select: { name: true, username: true } } },
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

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <Link
          href="/my-notebooks"
          className="text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          ← My単語帳一覧
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {notebook.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              {notebook.cards.length}語
              {!isOwner && (
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  共同編集者として参加中
                </span>
              )}
            </p>
            {isOwner && (
              <div className="mt-3 flex flex-col items-start gap-2">
                <ShareNotebookButton notebookId={notebook.id} isPublic={notebook.isPublic} />
                <ShareManager
                  notebookId={notebook.id}
                  invites={invites}
                  shares={shares.map((share) => ({
                    id: share.id,
                    userName: share.user.username ?? share.user.name,
                  }))}
                />
              </div>
            )}
          </div>
          {notebook.cards.length > 0 && (
            <div className="flex items-center gap-3">
              {starredCount > 0 && (
                <Link
                  href={`/my-notebooks/${notebook.id}/review`}
                  className="rounded-full border border-coral-300 px-5 py-2 text-sm font-medium text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
                >
                  ★を復習する（{starredCount}語）
                </Link>
              )}
              <Link
                href={`/my-notebooks/${notebook.id}/study`}
                className="rounded-full bg-coral-500 px-5 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
              >
                暗記学習を始める
              </Link>
              {hasAnyStars && <ResetAllStarsButton notebookId={notebook.id} />}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
          {/* 登録フォームは一覧の下にあるため、単語が増えても迷わず辿り着けるよう上からジャンプできるようにする */}
          <a
            href="#add-card"
            className="rounded-full bg-coral-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
          >
            ＋ 単語を追加
          </a>
          <ImportCardsForm notebookId={notebook.id} />
          <ColumnsEditor notebookId={notebook.id} columns={columns} />
        </div>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-max border-collapse text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {/* 列見出しは columns の並び順そのまま表示する */}
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    {column}
                  </th>
                ))}
                <th className="px-4 py-3" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-500"
                  >
                    まだ単語がありません。下のフォームから追加してください。
                  </td>
                </tr>
              ) : (
                // 単語1件ずつをCardRowに委譲する。表示・編集・削除の切り替えは
                // 各CardRow内で完結し、このページ自体は再取得（revalidatePath）でのみ更新される
                cards.map((card) => (
                  <CardRow key={card.id} notebookId={notebook.id} columns={columns} card={card} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <section id="add-card" className="mt-8 scroll-mt-24">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
            単語を追加
          </h2>
          <CreateCardForm notebookId={notebook.id} columns={columns} />
        </section>
      </div>
    </main>
  );
}
