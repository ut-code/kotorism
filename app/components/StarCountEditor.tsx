import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import IntentForm from "@/components/IntentForm";

// ★の回数（card.starCount）の横に置く、数字をクリックすると開く修正用ポップオーバー。
// 誤って★をクリックしてしまった場合に、回数を直接書き換えたり0にリセットしたりできる。
// 単語帳の表は横スクロールのためにはみ出しを隠す枠の中にあり、枠の中に出すと窓の一部が隠れてしまうので、
// 窓は document.body 直下に出し（ポータル）、数字の真下に画面基準（position: fixed）で置く
const PANEL_WIDTH = 176;
const VIEWPORT_MARGIN = 8;

export default function StarCountEditor({
  cardId,
  notebookId,
  starCount,
  color,
}: {
  cardId: string;
  notebookId: string;
  starCount: number;
  color?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // 窓の位置（画面基準）。開いたときに数字の位置から求める
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // 数字の真下・中央に置き、画面の左右からはみ出さないようにする
      const centered = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
      const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(VIEWPORT_MARGIN, Math.min(centered, maxLeft)),
      });
    }
    setOpen((o) => !o);
  }

  // 画面に固定した窓が数字から離れないよう、スクロール・画面サイズの変更で閉じる
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="★の回数を修正する"
        aria-expanded={open}
        style={color ? { color } : undefined}
        className="text-xs leading-none text-zinc-400 underline decoration-dotted underline-offset-2 dark:text-zinc-600"
      >
        {starCount}
      </button>

      {open &&
        createPortal(
          <>
            {/* パネル外側をクリックしたら閉じる */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div
              style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
              className="fixed z-50 rounded-lg border border-black/[.08] bg-white p-3 text-left shadow-lg dark:border-white/[.145] dark:bg-zinc-900"
            >
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">★の回数を修正</p>
              {/* onSubmitはpreventDefaultせず、送信と同時にポップオーバーだけ閉じる */}
              <IntentForm
                action={`/my-notebooks/${notebookId}`}
                intent="setStarCount"
                fields={{ cardId }}
                onSubmit={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  name="count"
                  min={0}
                  defaultValue={starCount}
                  className="w-14 rounded border border-black/[.08] bg-transparent px-1.5 py-1 text-sm dark:border-white/[.145]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-coral-500 px-2.5 py-1 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
                >
                  保存
                </button>
              </IntentForm>
              <IntentForm
                action={`/my-notebooks/${notebookId}`}
                intent="resetStar"
                fields={{ cardId }}
                onSubmit={() => setOpen(false)}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="text-xs text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline dark:text-coral-400 dark:hover:text-coral-200"
                >
                  0にリセット
                </button>
              </IntentForm>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
