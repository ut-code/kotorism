"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// ヘッダーの「？」ボタン。ヘッダーは全ページ共通なので、どのページからでも使い方を開ける
// 押すと、画面の一番上のレイヤーに使い方をポップアップ表示する
// 背景クリック・×ボタン・Escキーで閉じる。ボタンの見た目はThemeToggleと揃えている
export default function HelpButton() {
  const [open, setOpen] = useState(false);

  // 開いている間はEscキーで閉じられるようにし、背面のページがスクロールしないよう固定する
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="使い方を見る"
        aria-label="使い方を見る"
        aria-haspopup="dialog"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17.25h.008v.008H12v-.008Z"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          // ヘッダー（z-50）やMy単語帳の使い方ガイド（z-[100]）より上に重ねるため、document.body直下にポータルする
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md sm:p-6"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-black/[.06] px-6 py-4 dark:border-white/[.1]">
                <h2 id="help-title" className="text-lg font-semibold text-black dark:text-zinc-50">
                  使い方
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="使い方を閉じる"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>

              {/* 本文。長くなっても画面からはみ出さないよう、この中だけスクロールさせる */}
              {/* TODO: 使い方の本文を差し替える */}
              <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                <p>準備中です。</p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
