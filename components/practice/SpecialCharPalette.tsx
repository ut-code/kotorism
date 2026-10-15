"use client";

import { useEffect, useState } from "react";
import type { PracticeLanguage } from "@/lib/practice-languages";

// ↑ / ↓ キーでの特殊文字の切り替え方の案内
export function AccentKeyHint({ language }: { language: PracticeLanguage }) {
  return (
    <>
      文字を入力した直後に <strong>↑ / ↓ キー</strong>を押すと、{language.accentName}
      に切り替えられます。
    </>
  );
}

// 表完成演習の特殊文字入力パレット。表が縦に長くなってもスクロールで画面外に出ないよう、
// 固定ヘッダーの直下に sticky で張り付ける（ヘッダーは折り返しで高さが変わるため実測する）。
// スマホでは1行の横スクロールにして画面を占有しすぎないようにし、ボタン押下で入力欄の
// フォーカス（=ソフトウェアキーボード）が外れないよう mousedown の既定動作を止めている
export function SpecialCharPalette({
  language,
  onInsert,
}: {
  language: PracticeLanguage;
  onInsert: (char: string) => void;
}) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setTop(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{ top }}
      // 画面上部に貼り付いたときに下の内容と重ならないよう、ページと同じ色の背景だけを敷く（枠・影は付けない）
      className="sticky z-40 border-b border-zinc-200 bg-[var(--background)]/95 py-2 text-center backdrop-blur sm:py-3 dark:border-zinc-800"
    >
      <span className="text-xs font-bold text-zinc-600 sm:text-sm dark:text-zinc-400">
        特殊文字（選択中の欄に入力）
      </span>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {language.specialChars.map((char) => (
          <button
            key={char}
            type="button"
            lang={language.lang}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(char)}
            className="h-11 w-11 shrink-0 rounded-xl border border-zinc-300 bg-white text-lg font-bold text-zinc-800 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
          >
            {char}
          </button>
        ))}
      </div>
      <p className="mt-2 hidden text-xs text-zinc-500 sm:block md:text-sm dark:text-zinc-400">
        <AccentKeyHint language={language} />
      </p>
    </div>
  );
}
