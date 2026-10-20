import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Form, useSubmit } from "react-router";

import Link from "@/components/Link";
import {
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  dayOfWeek,
  daysInMonth,
  formatDayLabel,
  formatMonthLabel,
  formatPeriodLabel,
  formatShortDay,
  weekStart,
  type CalendarView,
} from "@/lib/shared/study-calendar";
import { OTHER_MATERIAL_COLOR, materialColors } from "@/lib/shared/material-colors";
import {
  NOTEBOOK_CATEGORY,
  STREAK_MILESTONE_INTERVAL,
  formatDuration,
  isStudiedDay,
  type DayStat,
  type PeriodDetail,
  type PeriodMaterial,
  type StreakSummary,
} from "@/lib/shared/study-events";

type Option = { value: string; label: string };
type Filters = { language: string; deck: string; type: string };

type Props = {
  // すべて日本時間の "YYYY-MM-DD" / "YYYY-MM"
  today: string;
  firstDay: string;
  firstMonth: string;
  lastMonth: string;
  view: CalendarView;
  // 選択中の日（週・月表示ではこの日を含む週・月を選んでいる）
  date: string;
  // 日表示のカレンダーで開いている月
  month: string;
  // 日付 → その日の学習件数・学習時間（絞り込み適用後）。学習の無い日はキー自体が無い
  daily: Record<string, DayStat>;
  // 選択中の期間の内訳
  detail: PeriodDetail;
  streak: StreakSummary;
  filters: Filters;
  options: { languages: Option[]; decks: Option[]; types: Option[] };
};

type HrefState = Pick<Props, "view" | "date" | "month" | "filters">;

// 表示単位・選択中の期間・絞り込みを保ったまま、一部だけ差し替えた URL を作る
function calendarHref(
  state: HrefState,
  next: Partial<Pick<HrefState, "view" | "date" | "month">>,
): string {
  const params = new URLSearchParams();
  const view = next.view ?? state.view;
  const date = next.date ?? state.date;
  if (view !== "day") params.set("view", view);
  params.set("date", date);
  params.set("month", next.month ?? (next.date ? date.slice(0, 7) : state.month));
  for (const [key, value] of Object.entries(state.filters)) {
    if (value) params.set(key, value);
  }
  return `?${params.toString()}`;
}

// ---- 色 ----

// 学習時間の濃淡（0〜4段階）ごとの色。GitHub の貢献グラフと同じく、表示範囲内の最大値を基準に段階分けする。
const LEVEL_CLASSES = [
  "bg-zinc-100 dark:bg-zinc-800",
  "bg-coral-100",
  "bg-coral-300",
  "bg-coral-500",
  "bg-coral-700",
];

function levelOf(stat: DayStat | undefined, maxSeconds: number): number {
  if (!stat) return 0;
  // 学習時間を測れない操作（作文の提出など）だけの日も、学習したことが分かるよう一番薄い色にする
  if (stat.seconds <= 0 || maxSeconds <= 0) return stat.count > 0 ? 1 : 0;
  return Math.max(1, Math.min(4, Math.ceil((stat.seconds / maxSeconds) * 4)));
}

// 教材ごとの色は lib/shared/material-colors.ts（My単語帳は coral 系、学習教材は tealblue 系）
const OTHER_COLOR = OTHER_MATERIAL_COLOR;
const OTHER_KEY = "__other__";

function statLabel(stat: DayStat | undefined): string {
  if (!stat || (stat.seconds === 0 && stat.count === 0)) return "学習なし";
  const parts = [];
  if (stat.seconds > 0) parts.push(formatDuration(stat.seconds));
  if (stat.count > 0) parts.push(`${stat.count}件`);
  return parts.join("・");
}

function sumStats(stats: (DayStat | undefined)[]): DayStat {
  return stats.reduce<DayStat>(
    (sum, stat) => ({
      count: sum.count + (stat?.count ?? 0),
      seconds: sum.seconds + (stat?.seconds ?? 0),
    }),
    { count: 0, seconds: 0 },
  );
}

// ---- 全体 ----

export default function StudyCalendar(props: Props) {
  const { daily, view } = props;
  const total = sumStats(Object.values(daily));
  const studiedDays = Object.values(daily).filter(isStudiedDay).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          学習カレンダー
        </h2>
        <FilterForm {...props} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="過去12ヶ月の学習時間" value={formatDuration(total.seconds)} />
        <SummaryTile label="学習した日数" value={`${studiedDays}日`} />
        <StreakCard streak={props.streak} />
      </div>

      <ViewTabs {...props} />

      {view === "day" ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <MonthCalendar {...props} />
          <PeriodPanel {...props} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {view === "week" ? <WeekOverview {...props} /> : <MonthOverview {...props} />}
          <PeriodPanel {...props} />
        </div>
      )}

      <YearHeatmap {...props} />
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

// 連続学習日数と、次の節目（10日ごと）までの進み具合
function StreakCard({ streak }: { streak: StreakSummary }) {
  const { current, longest, studiedToday } = streak;
  const next = (Math.floor(current / STREAK_MILESTONE_INTERVAL) + 1) * STREAK_MILESTONE_INTERVAL;
  const progress = (current % STREAK_MILESTONE_INTERVAL) / STREAK_MILESTONE_INTERVAL;
  const hint = studiedToday
    ? `あと${next - current}日で${next}日連続`
    : current > 0
      ? `今日学習すると${current + 1}日連続！`
      : "今日から連続記録を始めましょう";

  return (
    <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 dark:border-coral-900/60 dark:bg-coral-950/30">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-coral-800 dark:text-coral-200">連続学習</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">最長 {longest}日</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-coral-800 dark:text-coral-200">
        <span aria-hidden="true">🔥</span> {current}日
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white dark:bg-zinc-800"
        role="progressbar"
        aria-label={`${next}日連続まで`}
        aria-valuemin={0}
        aria-valuemax={STREAK_MILESTONE_INTERVAL}
        aria-valuenow={current % STREAK_MILESTONE_INTERVAL}
      >
        <div
          className="h-full rounded-full bg-coral-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">{hint}</p>
    </div>
  );
}

// 言語・単語帳・問題種別での絞り込み。選んだ瞬間に検索パラメータを書き換えて loader を再実行する
function FilterForm({ view, date, month, filters, options }: Props) {
  const submit = useSubmit();
  const selectClass =
    "rounded-full border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <Form
      method="get"
      preventScrollReset
      onChange={(event) => {
        // 「すべて」（空の値）は URL に残さない
        const formData = new FormData(event.currentTarget);
        for (const [key, value] of [...formData.entries()]) {
          if (!value) formData.delete(key);
        }
        void submit(formData, { method: "get", preventScrollReset: true });
      }}
      className="flex flex-wrap items-center gap-2"
      aria-label="学習カレンダーの絞り込み"
    >
      {view !== "day" && <input type="hidden" name="view" value={view} />}
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="month" value={month} />
      <FilterSelect
        name="language"
        label="言語"
        all="すべての言語"
        value={filters.language}
        options={options.languages}
        className={selectClass}
      />
      <FilterSelect
        name="deck"
        label="単語帳"
        all="すべての単語帳"
        value={filters.deck}
        options={options.decks}
        className={selectClass}
      />
      <FilterSelect
        name="type"
        label="問題種別"
        all="すべての種別"
        value={filters.type}
        options={options.types}
        className={selectClass}
      />
      <noscript>
        <button type="submit" className={selectClass}>
          絞り込む
        </button>
      </noscript>
    </Form>
  );
}

function FilterSelect(props: {
  name: string;
  label: string;
  all: string;
  value: string;
  options: Option[];
  className: string;
}) {
  return (
    <select
      name={props.name}
      defaultValue={props.value}
      aria-label={props.label}
      className={props.className}
    >
      <option value="">{props.all}</option>
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ---- 過去12ヶ月のヒートマップ ----

// GitHub の貢献グラフ風の、過去12ヶ月を1マス1日で並べた一覧。列が週（日曜始まり）、行が曜日
function YearHeatmap(props: Props) {
  const { today, firstDay, daily, view, date } = props;
  const maxSeconds = Math.max(0, ...Object.values(daily).map((stat) => stat.seconds));

  // 画面幅が狭く横スクロールになるときは、最初から今月（右端）が見えるようにする。
  // 日付を選んで再表示されたときは、ユーザーが動かしたスクロール位置をそのまま保つ（初回表示のときだけ動かす）
  const scrollerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, []);

  const weeks: string[][] = [];
  for (let start = weekStart(firstDay); start <= today; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  }

  return (
    <div
      ref={scrollerRef}
      className="overflow-x-auto rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        過去12ヶ月の学習状況
      </h3>
      <div className="inline-flex flex-col gap-1">
        {/* 月の見出し。その週に1日が含まれる列にだけ出す */}
        <div className="flex gap-[3px] pl-6 text-[10px] text-zinc-500 dark:text-zinc-400">
          {weeks.map((week) => {
            const first = week.find((d) => d.endsWith("-01") && d >= firstDay && d <= today);
            return (
              <div key={week[0]} className="w-[11px] overflow-visible whitespace-nowrap">
                {first ? `${Number(first.slice(5, 7))}月` : ""}
              </div>
            );
          })}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex w-6 flex-col gap-[3px] text-[10px] leading-[11px] text-zinc-500 dark:text-zinc-400">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={label} className="h-[11px]">
                {i % 2 === 1 ? label : ""}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} className="flex flex-col gap-[3px]">
              {week.map((d) => {
                if (d < firstDay || d > today) return <div key={d} className="size-[11px]" />;
                const stat = daily[d];
                const selected = view === "day" && d === date;
                const label = `${formatDayLabel(d)}: ${statLabel(stat)}`;
                return (
                  <Link
                    key={d}
                    href={calendarHref(props, { view: "day", date: d })}
                    preventScrollReset
                    title={label}
                    aria-label={label}
                    aria-current={selected ? "date" : undefined}
                    className={`size-[11px] rounded-[2px] ${LEVEL_CLASSES[levelOf(stat, maxSeconds)]} ${
                      selected ? "ring-2 ring-zinc-800 dark:ring-zinc-100" : ""
                    } hover:ring-1 hover:ring-zinc-400`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          短
          {LEVEL_CLASSES.map((className) => (
            <span key={className} className={`size-[11px] rounded-[2px] ${className}`} />
          ))}
          長
        </div>
      </div>
    </div>
  );
}

// ---- 表示単位の切り替え ----

const VIEW_LABELS: Record<CalendarView, string> = { day: "日", week: "週", month: "月" };

function ViewTabs(props: Props) {
  return (
    <nav aria-label="表示単位" className="flex w-fit rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
      {(Object.keys(VIEW_LABELS) as CalendarView[]).map((view) => (
        <Link
          key={view}
          href={calendarHref(props, { view })}
          preventScrollReset
          aria-current={props.view === view ? "page" : undefined}
          className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
            props.view === view
              ? "bg-white text-coral-700 shadow-sm dark:bg-coral-800 dark:text-coral-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          }`}
        >
          {VIEW_LABELS[view]}
        </Link>
      ))}
    </nav>
  );
}

// ---- 日表示: 1ヶ月分のカレンダー ----

function MonthCalendar(props: Props) {
  const { month, firstMonth, lastMonth, firstDay, today, daily, date } = props;
  const days = daysInMonth(month);
  const leadingBlanks = dayOfWeek(days[0]);
  const maxSeconds = Math.max(0, ...days.map((d) => daily[d]?.seconds ?? 0));
  const prevMonth = month > firstMonth ? addMonths(month, -1) : null;
  const nextMonth = month < lastMonth ? addMonths(month, 1) : null;
  const navClass =
    "rounded-full px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="mb-3 flex items-center justify-between">
        {prevMonth ? (
          <Link
            href={calendarHref(props, { month: prevMonth })}
            preventScrollReset
            className={navClass}
            aria-label="前の月"
          >
            ←
          </Link>
        ) : (
          <span className={`${navClass} invisible`}>←</span>
        )}
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {formatMonthLabel(month)}
        </h3>
        {nextMonth ? (
          <Link
            href={calendarHref(props, { month: nextMonth })}
            preventScrollReset
            className={navClass}
            aria-label="次の月"
          >
            →
          </Link>
        ) : (
          <span className={`${navClass} invisible`}>→</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-xs text-zinc-500 dark:text-zinc-400">
            {label}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const dayNumber = Number(d.slice(8, 10));
          if (d > today || d < firstDay) {
            return (
              <div
                key={d}
                className="flex aspect-square items-center justify-center rounded-lg text-xs text-zinc-300 dark:text-zinc-700"
              >
                {dayNumber}
              </div>
            );
          }
          const stat = daily[d];
          const level = levelOf(stat, maxSeconds);
          const minutes = Math.floor((stat?.seconds ?? 0) / 60);
          return (
            <Link
              key={d}
              href={calendarHref(props, { date: d, month })}
              preventScrollReset
              aria-label={`${formatDayLabel(d)}: ${statLabel(stat)}`}
              aria-current={d === date ? "date" : undefined}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs leading-tight transition-transform hover:scale-105 ${LEVEL_CLASSES[level]} ${
                level >= 3
                  ? "text-white"
                  : level >= 1
                    ? "text-zinc-700"
                    : "text-zinc-700 dark:text-zinc-200"
              } ${d === date ? "ring-2 ring-zinc-800 dark:ring-zinc-100" : ""} ${
                d === today ? "font-bold" : ""
              }`}
            >
              {dayNumber}
              {minutes > 0 && <span className="text-[9px] opacity-80">{minutes}分</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ---- 週表示・月表示: 期間ごとの学習時間の棒グラフ ----

type Bar = {
  key: string;
  href: string;
  // 横軸の目盛り（空文字なら出さない）
  tick: string;
  // ツールチップ・読み上げ用
  label: string;
  stat: DayStat;
  selected: boolean;
};

function WeekOverview(props: Props) {
  const { firstDay, today, daily, date } = props;
  const selectedWeek = weekStart(date);
  const bars: Bar[] = [];
  const weekStarts: string[] = [];
  for (let start = weekStart(firstDay); start <= today; start = addDays(start, 7)) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter(
      (d) => d >= firstDay && d <= today,
    );
    const first = days[0];
    const stat = sumStats(days.map((d) => daily[d]));
    bars.push({
      key: start,
      href: calendarHref(props, { view: "week", date: first }),
      tick: "",
      label: `${formatShortDay(first)}〜${formatShortDay(days[days.length - 1])}の週: ${statLabel(stat)}`,
      stat,
      selected: start === selectedWeek,
    });
    weekStarts.push(start);
  }

  // 週の棒は月の途中で切り替わり、1ヶ月に入る棒の数も4〜5本とばらつくため、棒ごとに月名を付けると
  // 間隔が不揃いになる。各月1日が横軸上で実際にある位置（何本目の棒の何曜日か）に月名を置く
  const marks: MonthMark[] = [];
  for (let month = props.firstMonth; month <= props.lastMonth; month = addMonths(month, 1)) {
    const first = `${month}-01`;
    const weekIndex = weekStarts.indexOf(weekStart(first));
    if (weekIndex < 0) continue;
    marks.push({
      key: month,
      label: `${Number(month.slice(5, 7))}月`,
      position: (weekIndex + dayOfWeek(first) / 7) / weekStarts.length,
    });
  }
  return <OverviewCard title="週ごとの学習時間" bars={bars} monthMarks={marks} />;
}

function MonthOverview(props: Props) {
  const { firstMonth, lastMonth, daily, date, firstDay, today } = props;
  const bars: Bar[] = [];
  for (let month = firstMonth; month <= lastMonth; month = addMonths(month, 1)) {
    const stat = sumStats(daysInMonth(month).map((d) => daily[d]));
    const first = `${month}-01` < firstDay ? firstDay : `${month}-01`;
    bars.push({
      key: month,
      href: calendarHref(props, { view: "month", date: first > today ? today : first }),
      tick: `${Number(month.slice(5, 7))}月`,
      label: `${formatMonthLabel(month)}: ${statLabel(stat)}`,
      stat,
      selected: month === date.slice(0, 7),
    });
  }
  return <OverviewCard title="月ごとの学習時間" bars={bars} />;
}

function OverviewCard({
  title,
  bars,
  monthMarks,
}: {
  title: string;
  bars: Bar[];
  monthMarks?: MonthMark[];
}) {
  const maxSeconds = Math.max(0, ...bars.map((bar) => bar.stat.seconds));
  return (
    <div className="rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        棒をクリックすると、その期間の内訳を表示します
      </p>
      <ChartFrame
        maxSeconds={maxSeconds}
        ticks={bars.map((bar) => ({ key: bar.key, tick: bar.tick }))}
        monthMarks={monthMarks}
      >
        {bars.map((bar) => (
          <BarLink key={bar.key} href={bar.href} label={bar.label} selected={bar.selected}>
            <span
              className={`block w-full rounded-t-[4px] ${
                bar.selected
                  ? "bg-coral-600 dark:bg-coral-400"
                  : "bg-coral-300 group-hover:bg-coral-400 dark:bg-coral-800 dark:group-hover:bg-coral-700"
              }`}
              style={{ height: barHeight(bar.stat.seconds, maxSeconds) }}
            />
          </BarLink>
        ))}
      </ChartFrame>
    </div>
  );
}

function barHeight(seconds: number, maxSeconds: number): string {
  if (seconds <= 0 || maxSeconds <= 0) return "0";
  // 少しでも学習していれば見えるよう、最低2pxは残す
  return `max(2px, ${(seconds / maxSeconds) * 100}%)`;
}

// 横軸上の位置（左端 0 〜 右端 1）で指定する月の区切り
type MonthMark = { key: string; label: string; position: number };

// 棒グラフの枠。上端に最大値の目盛り線、下に横軸の目盛りを置く。
// 目盛りは棒ごと（ticks）か、横軸上の位置指定（monthMarks）のどちらかで出す
function ChartFrame({
  maxSeconds,
  ticks,
  monthMarks,
  children,
}: {
  maxSeconds: number;
  ticks: { key: string; tick: string }[];
  monthMarks?: MonthMark[];
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="relative h-40 border-b border-zinc-200 dark:border-zinc-700">
        {maxSeconds > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <span className="absolute right-0 -top-4 text-[10px] text-zinc-500 dark:text-zinc-400">
              {formatDuration(maxSeconds)}
            </span>
          </div>
        )}
        <div className="flex h-full items-end gap-[2px] pt-1">{children}</div>
      </div>
      {monthMarks ? (
        <div className="relative h-5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {monthMarks.map((mark) => (
            <div
              key={mark.key}
              className="absolute top-0 flex flex-col items-start"
              style={{ left: `${mark.position * 100}%` }}
            >
              <span className="h-1 border-l border-zinc-300 dark:border-zinc-600" />
              <span className="-translate-x-1/2 whitespace-nowrap">{mark.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex gap-[2px] text-[10px] text-zinc-500 dark:text-zinc-400">
          {ticks.map(({ key, tick }) => (
            <div key={key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
              {tick}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 棒1本分のクリック範囲（棒より広い縦いっぱい）とホバー時のツールチップ
function BarLink({
  href,
  label,
  selected,
  children,
}: {
  href: string;
  label: string;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      preventScrollReset
      aria-label={label}
      aria-current={selected ? "true" : undefined}
      className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow group-hover:block group-focus-visible:block dark:bg-zinc-100 dark:text-zinc-900">
        {label}
      </span>
    </Link>
  );
}

// ---- 選択中の期間の内訳 ----

function PeriodPanel(props: Props) {
  const { view, detail, daily } = props;
  const colors = materialColors(detail.materials);
  const periodDays = detail.days.map((d) => d.day);
  const studiedDays = periodDays.filter((d) => isStudiedDay(daily[d])).length;
  const isEmpty = detail.totalSeconds === 0 && detail.totalCount === 0;

  return (
    <div className="rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {formatPeriodLabel(view, detail.firstDay, detail.lastDay)}
      </h3>

      {isEmpty ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {view === "day" ? "この日" : view === "week" ? "この週" : "この月"}
          の学習記録はありません。
        </p>
      ) : (
        <>
          <dl
            className={`mt-4 grid grid-cols-2 gap-3 ${view === "day" ? "sm:grid-cols-3" : "sm:grid-cols-5"}`}
          >
            <Stat label="学習時間" value={formatDuration(detail.totalSeconds)} emphasis />
            {view !== "day" && (
              <Stat
                label="1日平均"
                value={formatDuration(
                  Math.round(detail.totalSeconds / Math.max(1, periodDays.length)),
                )}
              />
            )}
            {view !== "day" && <Stat label="学習した日" value={`${studiedDays}日`} />}
            <Stat label="学んだ単語" value={`${detail.learnedWordCount}語`} />
            <Stat label="復習" value={`${detail.reviewCount}回`} />
          </dl>

          {view !== "day" && detail.totalSeconds > 0 && <StackedDays {...props} colors={colors} />}

          <MaterialList materials={detail.materials} colors={colors} />
          {detail.truncated && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              記録が多いため、件数は一部のみ数えています。
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-xl bg-coral-50 px-3 py-2 dark:bg-coral-950/40">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`mt-0.5 font-semibold text-coral-800 dark:text-coral-200 ${emphasis ? "text-xl" : "text-lg"}`}
      >
        {value}
      </dd>
    </div>
  );
}

// 週・月の日ごとの学習時間を、教材ごとに色分けして積み上げた棒グラフ。棒をクリックするとその日の内訳へ
function StackedDays(props: Props & { colors: Map<string, string> }) {
  const { detail, colors, view } = props;
  const materialsByKey = new Map(detail.materials.map((m) => [m.key, m]));
  const maxSeconds = Math.max(
    0,
    ...detail.days.map((d) => Object.values(d.seconds).reduce((sum, s) => sum + s, 0)),
  );
  const legend = detail.materials.filter((m) => m.seconds > 0 && colors.get(m.key) !== OTHER_COLOR);
  const hasOther = detail.materials.some((m) => colors.get(m.key) === OTHER_COLOR);

  return (
    <div className="mt-5">
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300"
        aria-label="凡例"
      >
        {legend.map((m) => (
          <li key={m.key} className="flex items-center gap-1.5">
            <Swatch color={colors.get(m.key) ?? OTHER_COLOR} />
            {legendLabel(m)}
          </li>
        ))}
        {hasOther && (
          <li className="flex items-center gap-1.5">
            <Swatch color={OTHER_COLOR} />
            その他
          </li>
        )}
      </ul>
      <ChartFrame
        maxSeconds={maxSeconds}
        ticks={detail.days.map(({ day }) => ({
          key: day,
          // 週表示は全曜日、月表示は 1・8・15・22・29 日だけに目盛りを出す
          tick:
            view === "week"
              ? `${formatShortDay(day)}(${WEEKDAY_LABELS[dayOfWeek(day)]})`
              : (Number(day.slice(8, 10)) - 1) % 7 === 0
                ? String(Number(day.slice(8, 10)))
                : "",
        }))}
      >
        {detail.days.map(({ day, seconds }) => {
          // 「その他」にまとめる教材は1つの塊にして、上位4教材を下から順に積む
          const segments = new Map<string, number>();
          for (const [key, value] of Object.entries(seconds)) {
            const segmentKey = colors.get(key) === OTHER_COLOR ? OTHER_KEY : key;
            segments.set(segmentKey, (segments.get(segmentKey) ?? 0) + value);
          }
          const ordered = [
            ...legend
              .filter((m) => segments.has(m.key))
              .map((m) => [m.key, segments.get(m.key) ?? 0] as const),
            ...(segments.has(OTHER_KEY)
              ? [[OTHER_KEY, segments.get(OTHER_KEY) ?? 0] as const]
              : []),
          ];
          const total = ordered.reduce((sum, [, value]) => sum + value, 0);
          const label = `${formatDayLabel(day)}: ${
            total > 0
              ? ordered
                  .map(
                    ([key, value]) =>
                      `${key === OTHER_KEY ? "その他" : legendLabel(materialsByKey.get(key))} ${formatDuration(value)}`,
                  )
                  .join(" / ")
              : "学習なし"
          }`;
          return (
            <BarLink
              key={day}
              href={calendarHref(props, { view: "day", date: day })}
              label={label}
              selected={false}
            >
              {/* 積み上げの各段の間に2pxの隙間を空ける（flex-col-reverse で下から積む） */}
              <span
                className="flex w-full flex-col-reverse gap-[2px]"
                style={{ height: barHeight(total, maxSeconds) }}
              >
                {ordered.map(([key, value], i) => (
                  <span
                    key={key}
                    className={`block w-full ${i === ordered.length - 1 ? "rounded-t-[4px]" : ""}`}
                    style={{
                      flexGrow: value,
                      flexBasis: 0,
                      minHeight: 1,
                      background: key === OTHER_KEY ? OTHER_COLOR : colors.get(key),
                    }}
                  />
                ))}
              </span>
            </BarLink>
          );
        })}
      </ChartFrame>
    </div>
  );
}

// 凡例・ツールチップ用の教材名。学習教材はページ名が言語間で重なる（例: 各言語の「作文」）ため言語を添える
function legendLabel(material: PeriodMaterial | undefined): string {
  if (!material) return "";
  return material.category && material.category !== NOTEBOOK_CATEGORY
    ? `${material.label}（${material.category}）`
    : material.label;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-sm"
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

// 教材ごとの学習時間（多い順）と、操作の種類ごとの回数
function MaterialList({
  materials,
  colors,
}: {
  materials: PeriodMaterial[];
  colors: Map<string, string>;
}) {
  const maxSeconds = Math.max(0, ...materials.map((m) => m.seconds));
  return (
    <ul className="mt-5 flex flex-col gap-3">
      {materials.map((material) => (
        <li key={material.key} className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              {material.seconds > 0 && <Swatch color={colors.get(material.key) ?? OTHER_COLOR} />}
              {material.category && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {material.category}
                </span>
              )}
              {material.href ? (
                <Link
                  href={material.href}
                  className="text-sm font-medium text-zinc-800 hover:underline dark:text-zinc-100"
                >
                  {material.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {material.label}
                </span>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {material.seconds > 0 ? formatDuration(material.seconds) : "—"}
            </span>
          </div>
          {material.seconds > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(material.seconds / maxSeconds) * 100}%`,
                  background: colors.get(material.key) ?? OTHER_COLOR,
                }}
              />
            </div>
          )}
          {material.counts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {material.counts.map((count) => (
                <span
                  key={count.eventType}
                  className="rounded-full bg-coral-100 px-2.5 py-0.5 text-xs text-coral-800 dark:bg-coral-950 dark:text-coral-200"
                >
                  {count.label} {count.count}回
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
