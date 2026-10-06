import "server-only";

import { getAllLanguageSections } from "@/app/learn/content";
import { LANGUAGES } from "@/app/learn/languages";
import { normalizeCardData } from "@/lib/card-data";
import { prisma } from "@/lib/prisma";

const MAX_CARD_RESULTS = 30;

export type NotebookHit = { id: string; title: string };
export type CardHit = {
  cardId: string;
  notebookId: string;
  notebookTitle: string;
  head: string;
  matched: string;
};
export type SectionHit = { href: string; languageLabel: string; title: string };

// セクションのtitleはMDX/TSXのexportから動的に読むため、文字列でない値が混ざっても落ちないようにする
function includes(text: unknown, needle: string): boolean {
  return typeof text === "string" && text.toLowerCase().includes(needle);
}

// 自分の単語帳（共同編集中のものを含む）から、単語帳名・見出し語・各列の値に一致するものを探す。
// カードの中身はJSONで保存されておりDB側で部分一致できないため、アクセス権のある単語帳のカードを
// 読み込んでからアプリ側で絞り込む（個人用の規模を想定した実装）
export async function searchNotebooks(
  userId: string,
  query: string,
): Promise<{ notebooks: NotebookHit[]; cards: CardHit[]; truncated: boolean }> {
  const needle = query.trim().toLowerCase();
  if (!needle) return { notebooks: [], cards: [], truncated: false };

  const accessible = await prisma.notebook.findMany({
    where: { OR: [{ userId }, { shares: { some: { userId } } }] },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      cards: { orderBy: { position: "asc" }, select: { id: true, data: true } },
    },
  });

  const notebooks: NotebookHit[] = [];
  const cards: CardHit[] = [];
  let truncated = false;

  for (const notebook of accessible) {
    if (includes(notebook.title, needle))
      notebooks.push({ id: notebook.id, title: notebook.title });

    for (const card of notebook.cards) {
      const data = normalizeCardData(card.data);
      const matched = includes(data.head, needle)
        ? data.head
        : data.rows.flatMap((row) => Object.values(row)).find((value) => includes(value, needle));
      if (matched === undefined) continue;

      if (cards.length >= MAX_CARD_RESULTS) {
        truncated = true;
        break;
      }
      cards.push({
        cardId: card.id,
        notebookId: notebook.id,
        notebookTitle: notebook.title,
        head: data.head,
        matched,
      });
    }
  }
  return { notebooks, cards, truncated };
}

// 学習教材のセクション名（例: 「動詞の活用」）に一致するものを探す。ログイン不要
export async function searchSections(query: string): Promise<SectionHit[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const all = await getAllLanguageSections(LANGUAGES.map((l) => l.languageSlug));
  return LANGUAGES.flatMap((language) =>
    (all[language.languageSlug] ?? [])
      .filter((section) => includes(section.title, needle))
      .map((section) => ({
        href: `/learn/${language.languageSlug}/${section.sectionSlug}`,
        languageLabel: language.label,
        title: section.title,
      })),
  );
}
