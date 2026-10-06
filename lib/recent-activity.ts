import "server-only";

import { getSections } from "@/app/learn/content";
import { getLanguage } from "@/app/learn/languages";
import { prisma } from "@/lib/prisma";

const RECENT_NOTEBOOK_LIMIT = 3;
const RECENT_SECTION_LIMIT = 4;
// 同じ単語帳の学習履歴が連続しても、直近の単語帳をRECENT_NOTEBOOK_LIMIT冊分そろえられるだけ多めに読む
const PROGRESS_SCAN_LIMIT = 100;

export type RecentNotebook = { id: string; title: string };
export type RecentSection = { href: string; languageLabel: string; title: string };

// 暗記学習・★操作などでカードの進捗を最後に更新した順に、最近使った単語帳を返す。
// 共同編集から外れた単語帳は出さないよう、今もアクセス権のあるものに絞る
export async function getRecentNotebooks(userId: string): Promise<RecentNotebook[]> {
  const rows = await prisma.cardProgress.findMany({
    where: {
      userId,
      card: { notebook: { OR: [{ userId }, { shares: { some: { userId } } }] } },
    },
    orderBy: { updatedAt: "desc" },
    take: PROGRESS_SCAN_LIMIT,
    select: { card: { select: { notebook: { select: { id: true, title: true } } } } },
  });

  const seen = new Map<string, RecentNotebook>();
  for (const { card } of rows) {
    if (!seen.has(card.notebook.id)) seen.set(card.notebook.id, card.notebook);
    if (seen.size >= RECENT_NOTEBOOK_LIMIT) break;
  }
  return [...seen.values()];
}

// クイズの回答・復習済み・苦手タグなど、セクションの進捗を最後に更新した順に返す。
// 削除・改名されて今は存在しないセクションは除く
export async function getRecentSections(userId: string): Promise<RecentSection[]> {
  const rows = await prisma.sectionProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: RECENT_SECTION_LIMIT * 2,
    select: { language: true, sectionSlug: true },
  });

  const recent: RecentSection[] = [];
  for (const row of rows) {
    const language = getLanguage(row.language);
    if (!language) continue;
    const section = (await getSections(row.language)).find(
      (s) => s.sectionSlug === row.sectionSlug,
    );
    if (!section) continue;
    recent.push({
      href: `/learn/${row.language}/${row.sectionSlug}`,
      languageLabel: language.label,
      title: section.title,
    });
    if (recent.length >= RECENT_SECTION_LIMIT) break;
  }
  return recent;
}
