import Link from "next/link";

import { prisma } from "@/lib/prisma";
import CreateBlankNotebookForm from "@/components/my-notebooks/CreateBlankNotebookForm";
import { requireUser } from "@/lib/session";
import DeleteNotebookButton from "@/components/my-notebooks/DeleteNotebookButton";
import StarColorSettings from "@/components/StarColorSettings";
import NotebookGuideButton from "@/components/my-notebooks/NotebookGuideButton";

// DBの最新状態を常に表示するため、ビルド時の静的プリレンダリングを避けてリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function MyNotebooksPage() {
  const user = await requireUser();

  // 作成日が新しい単語帳を先頭に表示する。ログイン中のユーザー自身の単語帳のみに絞り込む。
  // _count で各単語帳の単語数だけを取得し、cards本体は取得しない（一覧表示には不要なため軽量化）
  const notebooks = await prisma.notebook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cards: true } } },
  });

  // 他人の単語帳から共同編集者として招待され、参加済みのもの
  const sharedNotebooks = await prisma.notebookShare.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      notebook: {
        include: { _count: { select: { cards: true } }, user: { select: { name: true } } },
      },
    },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          My単語帳
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          単語帳を新規作成し、Excelファイルから単語をまとめて追加できます。
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <NotebookGuideButton />
          <StarColorSettings />
        </div>
      </div>

      <section className="mt-10 w-full max-w-md">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
          新規作成
        </h2>
        <CreateBlankNotebookForm />
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          作成後の単語帳ページの「Excelから単語を追加」から、テンプレートのダウンロードとExcelファイルの取り込みができます。
        </p>
      </section>

      <section className="mt-12 w-full max-w-2xl">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
          作成済みの単語帳
        </h2>
        {/* 単語帳が1件も無ければ空状態のメッセージ、あれば一覧をレンダリング */}
        {notebooks.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            まだ単語帳がありません。上のフォームから作成してみましょう。
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notebooks.map((notebook) => (
              <li
                key={notebook.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-coral-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-coral-300 hover:shadow-xl hover:shadow-coral-100 dark:border-coral-900/40 dark:bg-zinc-950 dark:hover:border-coral-700/60 dark:hover:shadow-none"
              >
                <Link href={`/my-notebooks/${notebook.id}`} className="flex-1 text-left">
                  <p className="font-medium text-black dark:text-zinc-50">{notebook.title}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                    {notebook._count.cards}語
                  </p>
                </Link>
                <DeleteNotebookButton notebookId={notebook.id} />
              </li>
            ))}
          </ul>
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
                    {share.notebook._count.cards}語 ・ {share.notebook.user.name}さんが作成
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
