import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// 演習の設定・操作に使う共通の部品。どの演習でも見た目と並べ方を揃えるためのもの

// 押すと中身を開閉する設定の見出し（▶ が開くと下を向く）。h3 の中に置く
export function CollapseToggle({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group inline-flex items-baseline gap-2 text-left hover:text-tealblue-700 dark:hover:text-tealblue-300"
    >
      <span
        aria-hidden="true"
        className={`inline-block text-xs text-zinc-400 transition-transform group-hover:text-tealblue-600 dark:text-zinc-500 ${open ? "rotate-90" : ""}`}
      >
        ▶
      </span>
      {children}
    </button>
  );
}

// 演習の設定の1項目。見出し（項目名と今の値）を押したときだけ中身を開く
export function CollapsibleSetting({
  title,
  summary,
  children,
}: {
  title: string;
  // 閉じている間も見出しに出す、今の値
  summary?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
        <CollapseToggle open={open} onToggle={() => setOpen(!open)}>
          {title}
          {summary !== undefined && (
            <span className="line-clamp-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              {summary}
            </span>
          )}
        </CollapseToggle>
      </h3>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

// 1つだけ選ぶ設定。閉じている間は今の選択を見出しに出す
export function CollapsibleChoice<T extends string>({
  title,
  options,
  value,
  onChange,
  note,
}: {
  title: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // 選択肢の下に出す補足
  note?: ReactNode;
}) {
  return (
    <CollapsibleSetting
      title={title}
      summary={options.find((option) => option.value === value)?.label}
    >
      <ChoiceChips label={title} options={options} value={value} onChange={onChange} />
      {note && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>}
    </CollapsibleSetting>
  );
}

export type ChoiceOption<T extends string> = { value: T; label: string };

// 1つだけ選ぶ選択肢（チップ）
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  // 読み上げ用のグループ名
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              selected
                ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-400 dark:bg-tealblue-950/50 dark:text-tealblue-300"
                : "border-zinc-200 text-zinc-600 hover:border-tealblue-300 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-600 dark:hover:text-tealblue-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// メインの操作（primary）と、それ以外の操作（secondary）のボタン
export function PracticeButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const variantClass =
    variant === "primary"
      ? "bg-tealblue-600 px-8 text-white shadow-sm hover:bg-tealblue-700 dark:bg-tealblue-500 dark:hover:bg-tealblue-600"
      : "border border-zinc-300 px-6 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full py-3 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClass} ${className}`}
    />
  );
}

// 答え合わせの下に出す「発音を聞く」ボタン
export function SpeakButton({ speaking, onClick }: { speaking: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
    >
      {speaking ? "再生中…" : "発音を聞く"}
    </button>
  );
}

// 読み上げのオン・オフの選択肢
export const AUDIO_OPTIONS: ChoiceOption<"on" | "off">[] = [
  { value: "on", label: "読み上げる" },
  { value: "off", label: "読み上げない" },
];

// 正答数と正答率
export function ScoreSummary({
  correct,
  total,
  unit,
}: {
  correct: number;
  total: number;
  // 「問」「か所」など
  unit: string;
}) {
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">結果</p>
      <p className="mt-2 text-zinc-900 dark:text-zinc-50">
        <span className="text-5xl font-black tabular-nums">{correct}</span>
        <span className="ml-2 text-lg font-bold text-zinc-500 dark:text-zinc-400">
          / {total} {unit}正解
        </span>
      </p>
      <p className="mt-1 font-semibold text-zinc-600 dark:text-zinc-400">正答率 {rate}%</p>
    </div>
  );
}

// 出題データが無いときの表示
export function EmptyPractice({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">{children}</p>;
}
