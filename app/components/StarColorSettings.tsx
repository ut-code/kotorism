import { useState } from "react";

import { useStarColors } from "@/hooks/useStarColors";
import { STAR_COLOR_LABELS, STAR_COLOR_LEVELS } from "@/lib/shared/star-colors";

// ヘッダーから開ける★の色設定パネル。★を付けた回数（1回目/2回目/3回目以降）ごとに
// 色を自由に選べるようにし、選んだ色はStarColorsProvider経由でlocalStorageに保存される
export default function StarColorSettings() {
  const [open, setOpen] = useState(false);
  const { colors, setColor, resetColors } = useStarColors();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full border border-coral-300 px-3 py-1.5 text-sm text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
      >
        ★の色
      </button>

      {open && (
        <>
          {/* パネル外側をクリックしたら閉じる */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-black/[.08] bg-white p-4 text-left shadow-lg dark:border-white/[.145] dark:bg-zinc-900">
            <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              ★の色を回数ごとに設定
            </p>
            <div className="flex flex-col gap-3">
              {STAR_COLOR_LEVELS.map((level) => (
                <label
                  key={level}
                  className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  {STAR_COLOR_LABELS[level]}
                  <input
                    type="color"
                    value={colors[level]}
                    onChange={(event) => setColor(level, event.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-black/[.08] bg-transparent dark:border-white/[.145]"
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={resetColors}
              className="mt-4 text-xs text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline dark:text-coral-400 dark:hover:text-coral-200"
            >
              初期設定に戻す
            </button>
          </div>
        </>
      )}
    </div>
  );
}
