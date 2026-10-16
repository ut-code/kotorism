// 学習カレンダーの日付計算。日の区切りは日本時間（UTC+9、夏時間なし）で固定する。
// 日付は "YYYY-MM-DD"、月は "YYYY-MM" の文字列で扱い、計算は UTC の Date 上で行う
// （サーバーとブラウザのタイムゾーンが違っても同じ結果になるようにするため）

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// 学習カレンダーで遡れる月数（今月を含む）
export const CALENDAR_MONTHS = 12;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

// 日時を日本時間の日付にする
export function toStudyDay(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

// 日本時間でのその日の 0:00 〜 翌日 0:00
export function studyDayRange(day: string): { start: Date; end: Date } {
  const start = new Date(Date.parse(`${day}T00:00:00Z`) - JST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

export function isValidDay(value: string): boolean {
  return DAY_PATTERN.test(value) && toUtcDate(value).toISOString().slice(0, 10) === value;
}

export function isValidMonth(value: string): boolean {
  if (!MONTH_PATTERN.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: string, amount: number): string {
  return new Date(toUtcDate(day).getTime() + amount * DAY_MS).toISOString().slice(0, 10);
}

export function addMonths(month: string, amount: number): string {
  const date = toUtcDate(`${month}-01`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

// 0 = 日曜 〜 6 = 土曜
export function dayOfWeek(day: string): number {
  return toUtcDate(day).getUTCDay();
}

// その月の1日〜末日
export function daysInMonth(month: string): string[] {
  const days: string[] = [];
  for (let day = `${month}-01`; day.startsWith(month); day = addDays(day, 1)) days.push(day);
  return days;
}

// 今日を含む過去 CALENDAR_MONTHS ヶ月分の表示範囲
export function calendarRange(today: string): {
  firstMonth: string;
  lastMonth: string;
  firstDay: string;
} {
  const lastMonth = today.slice(0, 7);
  const firstMonth = addMonths(lastMonth, -(CALENDAR_MONTHS - 1));
  return { firstMonth, lastMonth, firstDay: `${firstMonth}-01` };
}

export function formatMonthLabel(month: string): string {
  return `${Number(month.slice(0, 4))}年${Number(month.slice(5, 7))}月`;
}

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDayLabel(day: string): string {
  return `${Number(day.slice(0, 4))}年${Number(day.slice(5, 7))}月${Number(day.slice(8, 10))}日（${WEEKDAY_LABELS[dayOfWeek(day)]}）`;
}

// その日を含む週の日曜日（カレンダーは日曜始まり）
export function weekStart(day: string): string {
  return addDays(day, -dayOfWeek(day));
}

export function formatShortDay(day: string): string {
  return `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;
}

export type CalendarView = "day" | "week" | "month";

export function isCalendarView(value: string): value is CalendarView {
  return value === "day" || value === "week" || value === "month";
}

// 表示単位（日・週・月）で date を含む期間。過去12ヶ月の範囲（firstDay〜today）に収める
export function periodOf(
  view: CalendarView,
  date: string,
  firstDay: string,
  today: string,
): { firstDay: string; lastDay: string } {
  const clamp = (start: string, end: string) => ({
    firstDay: start < firstDay ? firstDay : start,
    lastDay: end > today ? today : end,
  });
  if (view === "week") return clamp(weekStart(date), addDays(weekStart(date), 6));
  if (view === "month") {
    const days = daysInMonth(date.slice(0, 7));
    return clamp(days[0], days[days.length - 1]);
  }
  return { firstDay: date, lastDay: date };
}

export function formatPeriodLabel(view: CalendarView, firstDay: string, lastDay: string): string {
  if (view === "month") return formatMonthLabel(firstDay.slice(0, 7));
  if (view === "week") {
    const sameYear = firstDay.slice(0, 4) === lastDay.slice(0, 4);
    const start = `${Number(firstDay.slice(0, 4))}年${Number(firstDay.slice(5, 7))}月${Number(firstDay.slice(8, 10))}日`;
    const end = sameYear
      ? `${Number(lastDay.slice(5, 7))}月${Number(lastDay.slice(8, 10))}日`
      : `${Number(lastDay.slice(0, 4))}年${Number(lastDay.slice(5, 7))}月${Number(lastDay.slice(8, 10))}日`;
    return `${start}〜${end}`;
  }
  return formatDayLabel(firstDay);
}
