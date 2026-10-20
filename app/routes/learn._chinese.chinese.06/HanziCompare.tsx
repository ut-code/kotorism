import { useState, useSyncExternalStore } from "react";

import HandwritingPractice from "./HandwritingPractice";
import HanziQuiz from "./HanziQuiz";

// 簡体字と日本語漢字の比較セクション。PCでは選択クイズ、スマホ・タブレットでは手書き練習を表示する。
// 端末に合わないほうを使いたい人のために、下のトグルで手動でも切り替えられる

type Mode = "quiz" | "handwriting";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "quiz", label: "選択クイズ", hint: "PC向け" },
  { value: "handwriting", label: "手書き練習", hint: "スマホ向け" },
];

// 指で操作する端末（スマホ・タブレット）かどうかで、最初に表示するモードを決める
const COARSE_POINTER = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(COARSE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): Mode {
  return window.matchMedia(COARSE_POINTER).matches ? "handwriting" : "quiz";
}

// サーバーでは端末が分からないため、ブラウザで判定できるまでは何も表示しない（一瞬だけ別のモードが出るのを防ぐ）
function getServerSnapshot(): Mode | null {
  return null;
}

export default function HanziCompare() {
  const deviceMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const mode = chosenMode ?? deviceMode;

  return (
    <div className="mt-8 w-full">
      {mode === null ? (
        <div className="min-h-64" aria-hidden="true" />
      ) : mode === "quiz" ? (
        <HanziQuiz />
      ) : (
        <HandwritingPractice />
      )}

      {mode !== null && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">練習の方法を切り替える</span>
          <div
            role="group"
            aria-label="練習の方法"
            className="flex w-full rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
          >
            {MODES.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setChosenMode(value)}
                className={`flex flex-1 flex-col items-center rounded-full px-2 py-1.5 text-sm font-medium transition-colors sm:flex-row sm:justify-center sm:gap-1.5 ${
                  mode === value
                    ? "bg-white text-tealblue-700 shadow-sm dark:bg-tealblue-700 dark:text-tealblue-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                }`}
              >
                {label}
                <span
                  className={`text-[10px] ${
                    mode === value
                      ? "text-zinc-400 dark:text-tealblue-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
