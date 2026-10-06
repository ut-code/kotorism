"use server";

import { prisma } from "@/lib/prisma";
import { normalizeCardData } from "@/lib/card-data";
import { getCurrentUser } from "@/lib/session";

export type NotebookOption = { id: string; title: string };

// 動詞活用演習の「My単語帳から選ぶ」で選べる単語帳（自分の単語帳と、共同編集者として参加中のもの）。
// 学習教材は未ログインでも使えるため、未ログインなら例外ではなく空配列を返す
export async function listNotebooksForConjugation(): Promise<NotebookOption[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.notebook.findMany({
    where: { OR: [{ userId: user.id }, { shares: { some: { userId: user.id } } }] },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
}

// 単語帳に登録された見出し語（カードの1列目の語）の一覧。権限の無い単語帳は空配列を返す
export async function getNotebookHeadwords(notebookId: string): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const notebook = await prisma.notebook.findFirst({
    where: {
      id: notebookId,
      OR: [{ userId: user.id }, { shares: { some: { userId: user.id } } }],
    },
    select: { cards: { orderBy: { position: "asc" }, select: { data: true } } },
  });
  if (!notebook) return [];

  return notebook.cards.map((card) => normalizeCardData(card.data).head).filter(Boolean);
}
