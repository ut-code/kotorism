import { createUtterance } from "@/lib/shared/speech";
import type { CharacterCompare } from "./compare-data";

// 簡体字・例を中国語の音声で読み上げる
export function speakChinese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(createUtterance(text, "zh-CN"));
}

export function SpeakButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => speakChinese(text)}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tealblue-50 text-tealblue-700 transition-colors hover:bg-tealblue-100 dark:bg-tealblue-950/50 dark:text-tealblue-300 dark:hover:bg-tealblue-900/60"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path strokeLinecap="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}

// 1文字分の大きな字。日本語の字と簡体字で lang を分け、ブラウザにそれぞれの字形のフォントを選ばせる
export function Glyph({
  char,
  kind,
  className = "text-6xl",
}: {
  char: string;
  kind: "japanese" | "simplified";
  className?: string;
}) {
  return (
    <span
      lang={kind === "japanese" ? "ja" : "zh-CN"}
      className={`font-bold leading-none ${className}`}
    >
      {char}
    </span>
  );
}

// 日本語の漢字と簡体字を並べ、読み・拼音・意味・例・注意点をまとめて見せる比較カード
export default function CompareCard({ item }: { item: CharacterCompare }) {
  return (
    <div className="rounded-2xl border border-tealblue-200 bg-white p-6 dark:border-tealblue-900/40 dark:bg-zinc-950">
      <div className="flex items-stretch justify-center gap-4 sm:gap-8">
        <div className="flex flex-1 flex-col items-center gap-3 rounded-xl bg-zinc-50 px-4 py-5 dark:bg-zinc-900">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">日本語の漢字</span>
          <Glyph
            char={item.japanese}
            kind="japanese"
            className="text-7xl text-zinc-900 dark:text-zinc-50"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">音読み：{item.reading}</span>
        </div>
        <div
          className="flex items-center text-2xl text-zinc-300 dark:text-zinc-600"
          aria-hidden="true"
        >
          ⇄
        </div>
        <div className="flex flex-1 flex-col items-center gap-3 rounded-xl bg-tealblue-50 px-4 py-5 dark:bg-tealblue-950/40">
          <span className="text-xs font-medium text-tealblue-700 dark:text-tealblue-300">
            簡体字
          </span>
          <Glyph
            char={item.simplified}
            kind="simplified"
            className="text-7xl text-tealblue-800 dark:text-tealblue-200"
          />
          <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {item.pinyin}
            <SpeakButton text={item.simplified} label={`「${item.simplified}」の発音を聞く`} />
          </span>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex gap-3">
          <dt className="w-12 shrink-0 text-zinc-500 dark:text-zinc-400">意味</dt>
          <dd className="text-zinc-800 dark:text-zinc-100">{item.meaning}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-12 shrink-0 text-zinc-500 dark:text-zinc-400">例</dt>
          <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-800 dark:text-zinc-100">
            <span lang="zh-CN" className="text-base font-semibold">
              {item.example.zh}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">{item.example.pinyin}</span>
            <span>＝ {item.example.ja}</span>
            <SpeakButton text={item.example.zh} label={`「${item.example.zh}」の発音を聞く`} />
          </dd>
        </div>
        {item.difference && (
          <div className="flex gap-3">
            <dt className="w-12 shrink-0 text-zinc-500 dark:text-zinc-400">字形</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{item.difference}</dd>
          </div>
        )}
      </dl>

      {item.note && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="font-semibold">意味の違いに注意：</span>
          {item.note}
        </p>
      )}
    </div>
  );
}
