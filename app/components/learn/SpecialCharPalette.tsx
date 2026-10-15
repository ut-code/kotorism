import { useEffect, useState } from "react";

interface SpecialCharPaletteProps {
  chars: string[];
  onInsert: (char: string) => void;
  hint: React.ReactNode;
}

// 表完成演習の特殊文字入力パレット。表が縦に長くなってもスクロールで画面外に出ないよう、
// 固定ヘッダーの直下に sticky で張り付ける（ヘッダーは折り返しで高さが変わるため実測する）。
// スマホでは1行の横スクロールにして画面を占有しすぎないようにし、ボタン押下で入力欄の
// フォーカス（=ソフトウェアキーボード）が外れないよう mousedown の既定動作を止めている
export function SpecialCharPalette({ chars, onInsert, hint }: SpecialCharPaletteProps) {
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
      className="sticky z-40 mb-8 rounded-xl border border-zinc-200/80 bg-zinc-50/95 p-2 text-center shadow-sm backdrop-blur sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/95"
    >
      <span className="text-xs font-bold text-zinc-700 sm:text-sm dark:text-zinc-300">
        特殊文字入力パレット (選択中セルへ挿入)
      </span>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 sm:mt-3 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {chars.map((char) => (
          <button
            key={char}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(char)}
            className="h-11 w-11 shrink-0 rounded-xl border border-zinc-300 bg-white text-lg font-bold text-zinc-800 shadow-sm transition-transform active:scale-95 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            {char}
          </button>
        ))}
      </div>
      <p className="mt-2.5 hidden text-xs text-zinc-500 sm:block md:text-sm dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
