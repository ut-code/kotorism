import PageTitle, { PAGE_MAIN_CLASS } from "@/components/PageTitle";
import Link from "@/components/Link";

import { prisma } from "@/lib/server/prisma.server";
import { passwordAuth } from "@/lib/server/auth.server";
import LinkGoogleButton from "@/components/auth/LinkGoogleButton";
import NewNotebookButton from "@/components/my-notebooks/NewNotebookButton";
import { requireUser } from "@/lib/server/session.server";
import StarColorSettings from "@/components/StarColorSettings";
import NotebookGuideButton from "@/components/my-notebooks/NotebookGuideButton";
import type { Route } from "./+types/route";

import {
  createBlankNotebook,
  moveNotebook,
  toggleNotebookFavorite,
  toggleNotebookStudied,
} from "@/lib/server/my-notebooks/actions.server";
import { sortNotebooks } from "@/lib/shared/notebook-order";
import OwnNotebookList from "./OwnNotebookList";

// 「新しい単語帳」(NewNotebookButton)からの送信を受ける。成功すると作成した単語帳へ redirect する。
// 一覧のお気に入り・学習済みの切り替えと、長押しでの並べ替え（OwnNotebookList）もここで受ける
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  switch (formData.get("intent")) {
    case "createBlankNotebook":
      return createBlankNotebook(formData);
    case "toggleFavorite":
      return toggleNotebookFavorite(String(formData.get("notebookId") ?? ""));
    case "toggleStudied":
      return toggleNotebookStudied(String(formData.get("notebookId") ?? ""));
    case "moveNotebook":
      return moveNotebook(formData);
    default:
      throw new Response("Bad Request", { status: 400 });
  }
}

export async function loader() {
  const user = await requireUser();

  // ログイン中のユーザー自身の単語帳を、お気に入り → 並び順 → 作成日の新しい順に並べる（sortNotebooks）。
  // _count で各単語帳の単語数だけを取得し、cards本体は取得しない（一覧表示には不要なため軽量化）
  const notebooks = sortNotebooks(
    await prisma.notebook.findMany({
      where: { userId: user.id },
      include: { _count: { select: { cards: true } } },
    }),
  );

  // 他人の単語帳から共同編集者として招待され、参加済みのもの
  const sharedNotebooks = await prisma.notebookShare.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      notebook: {
        include: {
          _count: { select: { cards: true } },
          user: { select: { name: true, username: true } },
        },
      },
    },
  });

  // パスワードログインを廃止したあとも同じデータに入れるよう、移行期間中は Google 未連携の人に連携を促す
  const needsGoogleLink =
    passwordAuth.login &&
    (await prisma.account.count({ where: { userId: user.id, providerId: "google" } })) === 0;

  return { notebooks, sharedNotebooks, needsGoogleLink };
}

export default function MyNotebooksPage({ loaderData }: Route.ComponentProps) {
  const { notebooks, sharedNotebooks, needsGoogleLink } = loaderData;

  return (
    <main className={PAGE_MAIN_CLASS}>
      <div className="w-full max-w-2xl text-center">
        <PageTitle>My単語帳</PageTitle>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          単語帳を作ったり、暗記したりできます。
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <NotebookGuideButton />
          <StarColorSettings />
        </div>
      </div>

      {needsGoogleLink && <LinkGoogleButton />}

      <section className="mt-10 flex w-full max-w-md flex-col items-center gap-3 text-center">
        <NewNotebookButton />
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          押すとすぐ新しい単語帳が開きます。タイトル・列・単語の入力やExcel・Googleスプレッドシートのファイルの取り込みは、開いたページでそのまま行えます。
        </p>
      </section>

      <section className="mt-12 w-full max-w-2xl">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
          作成したMy単語帳
        </h2>
        {/* 単語帳が1件も無ければ空状態のメッセージ、あれば一覧をレンダリング */}
        {notebooks.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            まだ単語帳がありません。上の「＋ 新しい単語帳」から作成してみましょう。
          </p>
        ) : (
          <OwnNotebookList notebooks={notebooks} />
        )}
      </section>

      {/* 自分がオーナーの単語帳が1件も無くても、共有された単語帳は独立して表示する */}
      {sharedNotebooks.length > 0 && (
        <section className="mt-12 w-full max-w-2xl">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
            共有されている単語帳
          </h2>
          <ul className="flex flex-col gap-3">
            {sharedNotebooks.map((share) => (
              <li
                key={share.id}
                className="rounded-2xl border border-coral-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-coral-300 hover:shadow-xl hover:shadow-coral-100 dark:border-coral-900/40 dark:bg-zinc-950 dark:hover:border-coral-700/60 dark:hover:shadow-none"
              >
                <Link href={`/my-notebooks/${share.notebook.id}`} className="block text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {share.notebook.title}
                    </p>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      共同編集者
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                    {share.notebook._count.cards}語
                  </p>
                  {/* 誰から共有された単語帳かを、薄く小さい文字で出す */}
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {share.notebook.user.username ?? share.notebook.user.name}さんから共有
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
