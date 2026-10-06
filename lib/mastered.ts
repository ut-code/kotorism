import "server-only";

import { prisma } from "@/lib/prisma";

// 「覚えた」単語の判定。専用のフラグは持たず、既存の学習進捗から導く:
// 暗記学習（/study, /review）で1回以上表示され、かつ今★が付いていない単語
export const masteredProgressWhere = { viewCount: { gt: 0 }, starred: false } as const;

// 単語帳ごとの「覚えた」単語数を返す（ユーザー自身の進捗のみ）。キーは単語帳ID、1件も無い単語帳は含まれない
export async function countMasteredByNotebook(
  userId: string,
  notebookIds: string[],
): Promise<Map<string, number>> {
  const rows = await prisma.cardProgress.findMany({
    where: { userId, ...masteredProgressWhere, card: { notebookId: { in: notebookIds } } },
    select: { card: { select: { notebookId: true } } },
  });

  const counts = new Map<string, number>();
  for (const { card } of rows) {
    counts.set(card.notebookId, (counts.get(card.notebookId) ?? 0) + 1);
  }
  return counts;
}
