import "server-only";

import { prisma } from "@/lib/prisma";

// 「今日」の区切りは日本時間（UTC+9）の0時とする。サーバーのタイムゾーンに依存させないため固定オフセットで計算する
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfTodayJst(now = new Date()): Date {
  const jstMs = now.getTime() + JST_OFFSET_MS;
  return new Date(Math.floor(jstMs / DAY_MS) * DAY_MS - JST_OFFSET_MS);
}

// 1日の学習目標と、今日「覚えた」にした単語数（全単語帳の合計）を返す
export async function getStudyGoalSummary(userId: string) {
  const since = startOfTodayJst();
  const [user, masteredToday] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyGoal: true } }),
    prisma.cardProgress.count({ where: { userId, masteredAt: { gte: since } } }),
  ]);
  return { dailyGoal: user.dailyGoal, masteredToday, since };
}
