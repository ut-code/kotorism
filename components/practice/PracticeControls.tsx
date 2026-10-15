import type { ButtonHTMLAttributes, ReactNode } from "react";

// 演習の設定・操作に使う共通の部品。どの演習でも見た目と並べ方を揃えるためのもの

// 設定の1項目。PC ではラベルを左、選択肢を右に、スマホではラベルを上に置く
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <div className="text-sm font-bold text-zinc-700 sm:w-24 sm:shrink-0 sm:pt-1.5 dark:text-zinc-300">
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
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
