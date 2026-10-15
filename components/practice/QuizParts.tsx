import type { ReactNode } from "react";

import { PracticeButton, ScoreSummary } from "@/components/practice/PracticeControls";

// 1問ずつ出題する演習の、出題中・答え合わせ・結果の画面に共通の部品

// 1問の答え合わせの結果。skipped は「パス」
export type QuizOutcome = "correct" | "wrong" | "timeout" | "skipped";

// 上部の「設定に戻る・問題 n/N・正解数・残り時間」と進み具合のバー
export function QuizProgress({
  current,
  total,
  correct,
  timeLeft,
  urgentSeconds,
  onBack,
}: {
  // 何問目か（1 始まり）
  current: number;
  total: number;
  correct: number;
  // 制限時間なしなら null
  timeLeft: number | null;
  // 残りがこの秒数以下になったら強調する
  urgentSeconds: number;
  onBack: () => void;
}) {
  const urgent = timeLeft !== null && timeLeft <= urgentSeconds;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-tealblue-600 hover:underline dark:text-tealblue-400"
        >
          ← 設定に戻る
        </button>
        <div className="flex items-center gap-4 tabular-nums">
          <span>
            問題 <strong className="text-base text-zinc-900 dark:text-zinc-100">{current}</strong> /{" "}
            {total}
          </span>
          <span>
            正解 <strong className="text-base text-zinc-900 dark:text-zinc-100">{correct}</strong>
          </span>
          {timeLeft !== null && (
            <span
              aria-live={urgent ? "polite" : "off"}
              className={urgent ? "font-bold text-rose-600 dark:text-rose-400" : ""}
            >
              残り <strong className="text-base">{timeLeft}</strong> 秒
            </span>
          )}
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="進み具合"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current - 1}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-tealblue-500 transition-[width] duration-300"
          style={{ width: `${total > 0 ? ((current - 1) / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

const OUTCOME_LABEL: Record<QuizOutcome, string> = {
  correct: "○ 正解",
  wrong: "✕ 不正解",
  timeout: "✕ 時間切れ",
  skipped: "— パス",
};

// 答え合わせの表示。正誤を色だけでなく記号と文字でも示す。箱には載せず、左の線で区切る
export function AnswerFeedback({
  outcome,
  answer,
  lang,
  explanation,
}: {
  outcome: QuizOutcome;
  answer: string;
  lang: string;
  explanation?: string;
}) {
  const correct = outcome === "correct";
  return (
    <div
      role="status"
      className={`border-l-4 py-1 pl-4 text-left ${
        correct ? "border-emerald-500" : "border-rose-500"
      }`}
    >
      <p
        className={`text-lg font-bold ${
          correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
        }`}
      >
        {OUTCOME_LABEL[outcome]}
      </p>
      {!correct && (
        <p className="mt-1 text-zinc-800 dark:text-zinc-200">
          正解:{" "}
          <span lang={lang} className="text-lg font-bold">
            {answer}
          </span>
        </p>
      )}
      {explanation && (
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <span className="font-bold">解説:</span> {explanation}
        </p>
      )}
      <p className="mt-2 hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
        Enter キーで次へ進みます
      </p>
    </div>
  );
}

export type QuizMistake = {
  key: string;
  // 問題の短い表記
  prompt: ReactNode;
  // 入力した答え（パス・時間切れで未入力なら null）
  given: string | null;
  outcome: QuizOutcome;
  answer: string;
};

// 結果画面: 正答数・正答率・間違えた問題の一覧と、次の操作
export function QuizResult({
  correct,
  total,
  mistakes,
  lang,
  onRetryMistakes,
  onRetry,
  onBack,
}: {
  correct: number;
  total: number;
  mistakes: QuizMistake[];
  lang: string;
  onRetryMistakes: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <ScoreSummary correct={correct} total={total} unit="問" />

      {mistakes.length > 0 && (
        <section className="mt-10">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
            間違えた問題（{mistakes.length}）
          </h3>
          <ul className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {mistakes.map((m) => (
              <li key={m.key} className="py-3">
                <div className="text-zinc-900 dark:text-zinc-100">{m.prompt}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {m.given ? (
                      <>
                        あなたの答え: <span lang={lang}>{m.given}</span>
                      </>
                    ) : m.outcome === "timeout" ? (
                      "時間切れ"
                    ) : (
                      "パス"
                    )}
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    正解: <span lang={lang}>{m.answer}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {mistakes.length > 0 && (
          <PracticeButton onClick={onRetryMistakes}>間違えた問題だけもう一度</PracticeButton>
        )}
        <PracticeButton variant={mistakes.length > 0 ? "secondary" : "primary"} onClick={onRetry}>
          新しい問題でもう一度
        </PracticeButton>
        <PracticeButton variant="secondary" onClick={onBack}>
          設定に戻る
        </PracticeButton>
      </div>
    </div>
  );
}
