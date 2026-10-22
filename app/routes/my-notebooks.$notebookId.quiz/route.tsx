import Link from "@/components/Link";
import { notFound } from "@/lib/server/http.server";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { getNotebookRole } from "@/lib/server/notebook-access.server";
import { normalizeCardData } from "@/lib/shared/card-data";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import { normalizeNotebookLanguage } from "@/lib/shared/notebook-language";
import QuizDeck from "./QuizDeck";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const user = await requireUser();
  const { notebookId } = params;

  // 作成者・共同編集者のいずれでもなければ404にする
  const role = await getNotebookRole(notebookId, user.id);
  if (!role) {
    notFound();
  }

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    include: { cards: { orderBy: { position: "asc" } } },
  });

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

export default function QuizPage({ loaderData }: Route.ComponentProps) {
  const { notebook, columns, cards } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">クイズ</p>

      <div className="mt-8 w-full max-w-xl">
        <QuizDeck
          notebookId={notebook.id}
          language={notebook.language}
          columns={columns}
          cards={cards}
        />
      </div>

      <Link
        href={`/my-notebooks/${notebook.id}`}
        className="mt-10 text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
      >
        ← 単語帳に戻る
      </Link>
    </main>
  );
}
