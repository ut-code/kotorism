import RecentActivity from "@/components/home/RecentActivity";
import StudyCalendar from "@/components/history/StudyCalendar";
import { LANGUAGES, getLanguage } from "@/app/learn/languages";
import { requireUser } from "@/lib/session.server";
import { getRecentNotebooks, getRecentSections } from "@/lib/recent-activity.server";
import {
  calendarRange,
  isCalendarView,
  isValidDay,
  isValidMonth,
  periodOf,
  toStudyDay,
} from "@/lib/study-calendar";
import { STUDY_EVENT_LABELS, STUDY_EVENT_TYPES, isStudyEventType } from "@/lib/study-events";
import {
  getDailyStats,
  getDeckOptions,
  getPeriodDetail,
  getStreakSummary,
  type StudyFilters,
} from "@/lib/study-events.server";
import type { Route } from "./+types/page";

// ログイン後の入口。最近見た単語帳・学習ページと、日別の学習実績カレンダーを表示する（未ログインなら /login へ）。
// カレンダーの表示単位・選択中の期間・絞り込みは URL の検索パラメータで持つ
// （?view=week&date=2026-10-15&month=2026-10&language=french&deck=<notebookId>&type=card_study）
// - view:  表示単位（day / week / month）
// - date:  選択中の日。週・月表示ではこの日を含む週・月を選んでいることになる
// - month: 日表示のカレンダーで開いている月
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser();
  const params = new URL(request.url).searchParams;

  const today = toStudyDay(new Date());
  const { firstMonth, lastMonth, firstDay } = calendarRange(today);

  const deckOptions = await getDeckOptions(user.id);

  // 不正な値・範囲外の値は黙って無視し、既定の表示に戻す
  const rawLanguage = params.get("language") ?? "";
  const rawDeck = params.get("deck") ?? "";
  const rawType = params.get("type") ?? "";
  const filters: StudyFilters = {
    language: getLanguage(rawLanguage) ? rawLanguage : "",
    deck: deckOptions.some((deck) => deck.id === rawDeck) ? rawDeck : "",
    type: isStudyEventType(rawType) ? rawType : "",
  };

  const rawView = params.get("view") ?? "";
  const view = isCalendarView(rawView) ? rawView : "day";
  const rawDate = params.get("date") ?? "";
  const date = isValidDay(rawDate) && rawDate >= firstDay && rawDate <= today ? rawDate : today;
  const rawMonth = params.get("month") ?? "";
  const month =
    isValidMonth(rawMonth) && rawMonth >= firstMonth && rawMonth <= lastMonth
      ? rawMonth
      : date.slice(0, 7);
  const period = periodOf(view, date, firstDay, today);

  const [notebooks, sections, daily, detail, streak] = await Promise.all([
    getRecentNotebooks(user.id),
    getRecentSections(user.id),
    getDailyStats(user.id, firstDay, today, filters),
    getPeriodDetail(user.id, period.firstDay, period.lastDay, filters),
    getStreakSummary(user.id, today),
  ]);

  return {
    notebooks,
    sections,
    calendar: {
      today,
      firstDay,
      firstMonth,
      lastMonth,
      view,
      date,
      month,
      daily,
      detail,
      streak,
      filters,
      options: {
        languages: LANGUAGES.map((l) => ({ value: l.languageSlug, label: l.label })),
        decks: deckOptions.map((deck) => ({ value: deck.id, label: deck.title })),
        types: STUDY_EVENT_TYPES.map((type) => ({ value: type, label: STUDY_EVENT_LABELS[type] })),
      },
    },
  };
}

export default function HistoryPage({ loaderData }: Route.ComponentProps) {
  const { notebooks, sections, calendar } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          最近の学習履歴
        </h1>
        <RecentActivity notebooks={notebooks} sections={sections} />
        <StudyCalendar {...calendar} />
      </div>
    </main>
  );
}
