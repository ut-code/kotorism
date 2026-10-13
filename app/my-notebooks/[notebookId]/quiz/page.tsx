import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getNotebookRole } from "@/lib/notebook-access";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";
import QuizDeck from "./QuizDeck";

// DBの最新状態を常に表示するため、ビルド時の静的プリレンダリングを避けてリクエスト時にレンダリングする
export const dynamic = "force-dynamic";

export default async function QuizPage(props: PageProps<"/my-notebooks/[notebookId]/quiz">) {
  const user = await requireUser();
  const { notebookId } = await props.params;

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

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {notebook.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">クイズ</p>

      <div className="mt-8 w-full max-w-xl">
        <QuizDeck columns={columns} cards={cards} />
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
