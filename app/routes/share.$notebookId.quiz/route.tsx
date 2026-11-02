import { redirect } from "react-router";
import Link from "@/components/Link";
import QuizDeck from "@/components/my-notebooks/QuizDeck";
import { notFound } from "@/lib/server/http.server";

import { prisma } from "@/lib/server/prisma.server";
import { normalizeCardData } from "@/lib/shared/card-data";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import { normalizeNotebookLanguage } from "@/lib/shared/notebook-language";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const { notebookId } = params;

  // 共有リンクを知っていれば誰でも（ログインしていなくても）解ける。
  // isPublicな単語帳のみ取得し、非公開・存在しないIDの場合は404にする
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId, isPublic: true },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  if (!notebook) {
    notFound();
  }
  if (notebook.cards.length === 0) {
    throw redirect(`/share/${notebook.id}`);
  }

  // ★や回答の記録はメンバーだけのものなので、閲覧専用のクイズには単語の中身だけを渡す
  const columns = normalizeColumns(notebook.columns);
  const cards = notebook.cards.map((card) => {
    const data = normalizeCardData(card.data);
    return { id: card.id, head: data.head, rows: data.rows };
  });

  return {
    notebook: {
      id: notebook.id,
      title: notebook.title,
      language: normalizeNotebookLanguage(notebook.language),
    },
    columns,
    cards,
  };
}

export default function SharedQuizPage({ loaderData }: Route.ComponentProps) {
  const { notebook, columns, cards } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">クイズ（閲覧専用）</p>

      <div className="mt-8 w-full max-w-xl">
        <QuizDeck
          notebookId={notebook.id}
          language={notebook.language}
          columns={columns}
          cards={cards}
          readOnly
        />
      </div>

      <Link
        href={`/share/${notebook.id}`}
        className="mt-10 text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
      >
        ← 単語帳に戻る
      </Link>
    </main>
  );
}
