import { redirect } from "react-router";
import { notFound } from "@/lib/http.server";

import { prisma } from "@/lib/prisma.server";
import PublicStudyDeck from "./PublicStudyDeck";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";
import type { Route } from "./+types/page";

export async function loader({ params }: Route.LoaderArgs) {
  const { notebookId } = params;

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

  const columns = normalizeColumns(notebook.columns);
  const cards = notebook.cards.map((card) => ({ id: card.id, data: normalizeCardData(card.data) }));

  return { notebook: { id: notebook.id, title: notebook.title }, columns, cards };
}

export default function SharedStudyPage({ loaderData }: Route.ComponentProps) {
  const { notebook, columns, cards } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">暗記学習モード（閲覧専用）</p>

      <div className="mt-8 w-full">
        <PublicStudyDeck notebookId={notebook.id} columns={columns} cards={cards} />
      </div>
    </main>
  );
}
