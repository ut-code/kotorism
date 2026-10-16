import { getSections } from "@/lib/shared/learn/content";
import { getLanguage } from "@/lib/shared/learn/languages";
import { prisma } from "@/lib/server/prisma.server";
import { addDays, studyDayRange, toStudyDay } from "@/lib/shared/study-calendar";
import {
  LEARNED_WORD_EVENT_TYPES,
  MIN_STUDY_SECONDS,
  REVIEW_EVENT_TYPES,
  STREAK_MILESTONE_INTERVAL,
  STUDY_EVENT_LABELS,
  isStudiedDay,
  isStudyEventType,
  type DayStat,
  type PeriodDetail,
  type PeriodMaterial,
  type StreakSummary,
  type StudyEventType,
} from "@/lib/shared/study-events";

// 期間の内訳として読み込むイベントの上限（極端に多い期間でも応答が重くなりすぎないように）
const PERIOD_EVENT_LIMIT = 20000;
// 1回の送信で加算する学習時間の上限（秒）。ブラウザは30秒ごとに送るので、多少の遅れを見込んだ値にする
const MAX_SECONDS_PER_REPORT = 120;

type StudyActivity = {
  eventType: StudyEventType;
  itemId: string;
  deckId?: string;
  language?: string;
};

function statKey(userId: string, day: string, activity: StudyActivity) {
  return {
    userId,
    day,
    eventType: activity.eventType,
    deckId: activity.deckId ?? "",
    language: activity.language ?? "",
  };
}

// 学習操作を1件記録し、日別集計も同時に1増やす。呼び出し側でアクセス権の確認を済ませてから呼ぶ。
// 記録に失敗しても学習そのもの（★・表示回数・提出など）は成功させたいため、例外は投げずにログだけ残す
export async function recordStudyEvent(userId: string, activity: StudyActivity) {
  const occurredAt = new Date();
  const day = toStudyDay(occurredAt);
  const key = statKey(userId, day, activity);

  try {
    await prisma.$transaction([
      prisma.studyEvent.create({
        data: {
          userId,
          occurredAt,
          eventType: activity.eventType,
          itemId: activity.itemId,
          deckId: activity.deckId ?? null,
          language: activity.language ?? null,
        },
      }),
      prisma.studyDailyStat.upsert({
        where: { userId_day_eventType_deckId_language: key },
        update: { count: { increment: 1 } },
        create: { ...key, count: 1 },
      }),
    ]);
    await touchStreak(userId, day);
  } catch (error) {
    console.error("Failed to record study event", error);
  }
}

// 学習ページを開いていた時間を加算する。clientId はページを開くたびにブラウザ側で作る識別子で、
// 同じページを開いている間の送信は同じ行（日付をまたいだら新しい行）にまとめる。
// 呼び出し側でアクセス権の確認を済ませてから呼ぶ
export async function recordStudyTime(
  userId: string,
  clientId: string,
  activity: StudyActivity,
  rawSeconds: number,
) {
  const seconds = Math.min(MAX_SECONDS_PER_REPORT, Math.max(0, Math.floor(rawSeconds)));
  if (seconds === 0) return;
  const day = toStudyDay(new Date());
  const key = statKey(userId, day, activity);

  await prisma.$transaction([
    prisma.studyTimeLog.upsert({
      where: { userId_clientId_day: { userId, clientId, day } },
      update: { seconds: { increment: seconds } },
      create: {
        userId,
        clientId,
        day,
        eventType: activity.eventType,
        itemId: activity.itemId,
        deckId: activity.deckId ?? null,
        language: activity.language ?? null,
        seconds,
      },
    }),
    prisma.studyDailyStat.upsert({
      where: { userId_day_eventType_deckId_language: key },
      update: { seconds: { increment: seconds } },
      create: { ...key, seconds },
    }),
  ]);

  // ページを一瞬開いただけの日は連続日数に数えない
  const total = await prisma.studyDailyStat.aggregate({
    where: { userId, day },
    _sum: { seconds: true },
  });
  if ((total._sum.seconds ?? 0) >= MIN_STUDY_SECONDS) await touchStreak(userId, day);
}

// ---- 連続学習日数 ----

// 日別集計から、day まで何日続けて学習しているかを数える（StudyStreak がまだ無いユーザーの初期化用）
async function countStreakFromStats(userId: string, day: string): Promise<number> {
  const rows = await prisma.studyDailyStat.groupBy({
    by: ["day"],
    where: { userId, day: { lte: day } },
    _sum: { count: true, seconds: true },
    orderBy: { day: "desc" },
  });
  const studied = new Set(
    rows
      .filter((row) => isStudiedDay({ count: row._sum.count ?? 0, seconds: row._sum.seconds ?? 0 }))
      .map((row) => row.day),
  );
  let streak = 0;
  for (let d = day; studied.has(d); d = addDays(d, -1)) streak += 1;
  return streak;
}

// day に学習したことを連続日数へ反映する。同じ日に何度呼んでも1日分しか進まない
async function touchStreak(userId: string, day: string) {
  const streak = await prisma.studyStreak.findUnique({ where: { userId } });
  if (!streak) {
    const current = await countStreakFromStats(userId, day);
    await prisma.studyStreak.upsert({
      where: { userId },
      update: {},
      create: { userId, currentStreak: current, longestStreak: current, lastStudyDay: day },
    });
    return;
  }
  if (streak.lastStudyDay >= day) return;

  const continued = streak.lastStudyDay === addDays(day, -1);
  const current = continued ? streak.currentStreak + 1 : 1;
  // 同時に届いたリクエストで二重に進めないよう、読んだ時点の lastStudyDay のままの場合だけ更新する
  await prisma.studyStreak.updateMany({
    where: { userId, lastStudyDay: streak.lastStudyDay },
    data: {
      currentStreak: current,
      longestStreak: Math.max(streak.longestStreak, current),
      lastStudyDay: day,
      // 途切れたら節目のお祝いもやり直す
      ...(continued ? {} : { celebratedStreak: 0 }),
    },
  });
}

export async function getStreakSummary(userId: string, today: string): Promise<StreakSummary> {
  const streak = await prisma.studyStreak.findUnique({ where: { userId } });
  if (!streak) return { current: 0, longest: 0, studiedToday: false };
  const alive = streak.lastStudyDay >= addDays(today, -1);
  return {
    current: alive ? streak.currentStreak : 0,
    longest: streak.longestStreak,
    studiedToday: streak.lastStudyDay === today,
  };
}

// まだお祝いしていない節目（10・20・30…日）に達していれば、その日数を返す
export async function getPendingCelebration(userId: string): Promise<number | null> {
  const today = toStudyDay(new Date());
  const streak = await prisma.studyStreak.findUnique({ where: { userId } });
  if (!streak || streak.lastStudyDay < addDays(today, -1)) return null;
  const milestone =
    Math.floor(streak.currentStreak / STREAK_MILESTONE_INTERVAL) * STREAK_MILESTONE_INTERVAL;
  return milestone > 0 && milestone > streak.celebratedStreak ? milestone : null;
}

// お祝いメッセージを閉じたときに呼び、同じ節目を二度表示しないようにする
export async function acknowledgeCelebration(userId: string, milestone: number) {
  await prisma.studyStreak.updateMany({
    where: { userId, celebratedStreak: { lt: milestone }, currentStreak: { gte: milestone } },
    data: { celebratedStreak: milestone },
  });
}

// ---- 学習カレンダーの集計 ----

export type StudyFilters = {
  language: string;
  deck: string;
  type: string;
};

// 絞り込み条件を StudyEvent / StudyTimeLog / StudyDailyStat 共通の where 条件にする。
// 言語で絞ると言語を持たない単語帳の操作は外れ、単語帳で絞ると学習教材の操作は外れる
function filterWhere(filters: StudyFilters) {
  return {
    ...(filters.language ? { language: filters.language } : {}),
    ...(filters.deck ? { deckId: filters.deck } : {}),
    ...(filters.type ? { eventType: filters.type } : {}),
  };
}

// firstDay〜lastDay（日本時間の日付）の、日ごとの学習件数と学習時間
export async function getDailyStats(
  userId: string,
  firstDay: string,
  lastDay: string,
  filters: StudyFilters,
): Promise<Record<string, DayStat>> {
  const rows = await prisma.studyDailyStat.groupBy({
    by: ["day"],
    where: { userId, day: { gte: firstDay, lte: lastDay }, ...filterWhere(filters) },
    _sum: { count: true, seconds: true },
  });
  return Object.fromEntries(
    rows.map((row) => [row.day, { count: row._sum.count ?? 0, seconds: row._sum.seconds ?? 0 }]),
  );
}

// 絞り込みに出す単語帳。今アクセスできる単語帳（自分の単語帳・共同編集中の単語帳）に限る
export async function getDeckOptions(userId: string): Promise<{ id: string; title: string }[]> {
  return prisma.notebook.findMany({
    where: { OR: [{ userId }, { shares: { some: { userId } } }] },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

type ActivityRow = {
  eventType: string;
  itemId: string;
  deckId: string | null;
  language: string | null;
};

// 教材ごとにまとめるためのキー
function materialKey(row: ActivityRow): string {
  if (row.deckId) return `deck:${row.deckId}`;
  if (row.eventType === "essay" || row.eventType === "translation") {
    return `${row.eventType}:${row.language}`;
  }
  return `section:${row.language}:${row.itemId}`;
}

// firstDay〜lastDay の学習内容を、教材ごと・日ごとにまとめて返す
export async function getPeriodDetail(
  userId: string,
  firstDay: string,
  lastDay: string,
  filters: StudyFilters,
): Promise<PeriodDetail> {
  const where = filterWhere(filters);
  const [events, timeLogs] = await Promise.all([
    prisma.studyEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: studyDayRange(firstDay).start, lt: studyDayRange(lastDay).end },
        ...where,
      },
      orderBy: { occurredAt: "asc" },
      take: PERIOD_EVENT_LIMIT,
      select: { occurredAt: true, eventType: true, itemId: true, deckId: true, language: true },
    }),
    prisma.studyTimeLog.findMany({
      where: { userId, day: { gte: firstDay, lte: lastDay }, ...where },
      select: {
        day: true,
        eventType: true,
        itemId: true,
        deckId: true,
        language: true,
        seconds: true,
      },
    }),
  ]);

  const deckIds = [
    ...new Set([...events, ...timeLogs].flatMap((row) => (row.deckId ? [row.deckId] : []))),
  ];
  const decks = await prisma.notebook.findMany({
    where: { id: { in: deckIds }, OR: [{ userId }, { shares: { some: { userId } } }] },
    select: { id: true, title: true },
  });
  const deckTitles = new Map(decks.map((deck) => [deck.id, deck.title]));

  const materials = new Map<string, PeriodMaterial>();
  async function materialFor(row: ActivityRow): Promise<PeriodMaterial> {
    const key = materialKey(row);
    let material = materials.get(key);
    if (!material) {
      material = { key, ...(await describeMaterial(row, deckTitles)), seconds: 0, counts: [] };
      materials.set(key, material);
    }
    return material;
  }

  const secondsByDay = new Map<string, Record<string, number>>();
  let totalSeconds = 0;
  for (const log of timeLogs) {
    const material = await materialFor(log);
    material.seconds += log.seconds;
    totalSeconds += log.seconds;
    const daySeconds = secondsByDay.get(log.day) ?? {};
    daySeconds[material.key] = (daySeconds[material.key] ?? 0) + log.seconds;
    secondsByDay.set(log.day, daySeconds);
  }

  // 学んだ単語は「日付:カードid」で数え、同じ日の重複だけを除く
  const learnedWords = new Set<string>();
  let reviewCount = 0;
  for (const event of events) {
    if (!isStudyEventType(event.eventType)) continue;
    const eventType = event.eventType;
    if (LEARNED_WORD_EVENT_TYPES.includes(eventType)) {
      learnedWords.add(`${toStudyDay(event.occurredAt)}:${event.itemId}`);
    }
    if (REVIEW_EVENT_TYPES.includes(eventType)) reviewCount += 1;

    const material = await materialFor(event);
    const count = material.counts.find((c) => c.eventType === eventType);
    if (count) count.count += 1;
    else material.counts.push({ eventType, label: STUDY_EVENT_LABELS[eventType], count: 1 });
  }

  const days: PeriodDetail["days"] = [];
  for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) {
    days.push({ day, seconds: secondsByDay.get(day) ?? {} });
  }

  return {
    firstDay,
    lastDay,
    totalSeconds,
    totalCount: events.length,
    learnedWordCount: learnedWords.size,
    reviewCount,
    materials: [...materials.values()].sort(
      (a, b) =>
        b.seconds - a.seconds ||
        b.counts.reduce((sum, c) => sum + c.count, 0) -
          a.counts.reduce((sum, c) => sum + c.count, 0),
    ),
    days,
    truncated: events.length >= PERIOD_EVENT_LIMIT,
  };
}

async function describeMaterial(
  row: ActivityRow,
  deckTitles: Map<string, string>,
): Promise<Pick<PeriodMaterial, "label" | "category" | "href">> {
  if (row.deckId) {
    const title = deckTitles.get(row.deckId);
    return {
      label: title ?? "（削除された、または共有が解除された単語帳）",
      category: "My単語帳",
      href: title ? `/my-notebooks/${row.deckId}` : null,
    };
  }

  const languageLabel = (row.language && getLanguage(row.language)?.label) ?? "";
  if (row.eventType === "essay" || row.eventType === "translation") {
    return { label: STUDY_EVENT_LABELS[row.eventType], category: languageLabel, href: null };
  }

  const section = row.language
    ? (await getSections(row.language)).find((s) => s.sectionSlug === row.itemId)
    : undefined;
  return {
    label: section?.title ?? "（削除された学習ページ）",
    category: languageLabel,
    href: section ? `/learn/${row.language}/${row.itemId}` : null,
  };
}
