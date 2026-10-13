import "server-only";

import { getSections } from "@/app/learn/content";
import { getLanguage } from "@/app/learn/languages";
import { prisma } from "@/lib/prisma";

const RECENT_NOTEBOOK_LIMIT = 3;
const RECENT_SECTION_LIMIT = 3;
// 削除・改名・アクセス権の喪失で表示できない履歴が混ざっても、上限件数をそろえられるよう多めに読む
const SCAN_FACTOR = 3;

export type RecentNotebook = { id: string; title: string };
export type RecentSection = { href: string; languageLabel: string; title: string };

// 単語帳を開いた日時を記録する。呼び出し側でアクセス権の確認を済ませてから呼ぶ
export async function recordNotebookView(userId: string, notebookId: string) {
  const now = new Date();
  await prisma.notebookView.upsert({
    where: { userId_notebookId: { userId, notebookId } },
    update: { lastViewedAt: now },
    create: { userId, notebookId, lastViewedAt: now },
  });
}

// 学習ページを開いた日時を記録する。存在しない言語・セクションは記録しない
export async function recordSectionView(userId: string, language: string, sectionSlug: string) {
  if (!getLanguage(language)) return;
  const sections = await getSections(language);
  if (!sections.some((s) => s.sectionSlug === sectionSlug)) return;

  const now = new Date();
  await prisma.sectionView.upsert({
    where: { userId_language_sectionSlug: { userId, language, sectionSlug } },
    update: { lastViewedAt: now },
    create: { userId, language, sectionSlug, lastViewedAt: now },
  });
}

// 最後に開いた順に、最近見た単語帳を返す。
// 共同編集から外れた単語帳は出さないよう、今もアクセス権のあるものに絞る
export async function getRecentNotebooks(userId: string): Promise<RecentNotebook[]> {
  const rows = await prisma.notebookView.findMany({
    where: {
      userId,
      notebook: { OR: [{ userId }, { shares: { some: { userId } } }] },
    },
    orderBy: { lastViewedAt: "desc" },
    take: RECENT_NOTEBOOK_LIMIT,
    select: { notebook: { select: { id: true, title: true } } },
  });
  return rows.map((row) => row.notebook);
}

// 最後に開いた順に、最近見た学習ページを返す。削除・改名されて今は存在しないセクションは除く
export async function getRecentSections(userId: string): Promise<RecentSection[]> {
  const rows = await prisma.sectionView.findMany({
    where: { userId },
    orderBy: { lastViewedAt: "desc" },
    take: RECENT_SECTION_LIMIT * SCAN_FACTOR,
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
