import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import Link from "@/components/Link";

import { apiPost } from "@/lib/shared/api-client";
import { BookmarkIcon } from "@/components/learn/BookmarkIcon";

const SIZES = {
  sm: { circle: "h-9 w-9", icon: "h-4 w-4" },
  md: { circle: "h-11 w-11", icon: "h-5 w-5" },
} as const;

interface SectionBookmarkButtonProps {
  language: string;
  sectionSlug: string;
  isLoggedIn: boolean;
  initialActive: boolean;
  size?: keyof typeof SIZES;
}

// 苦手タグ（manuallyTagged）のON/OFFを行うブックマークボタン。セクション一覧のカードと
// 各セクションページ右上の両方から、同じ見た目・挙動で使い回す。
// タップしやすいよう、アイコンを丸い背景で囲みその円全体をクリック範囲にする。
// 未ログイン時はいきなりログインページへ飛ばさず、画面を覆うモーダルで案内文とログイン/新規登録の
// 導線を提示する
export function SectionBookmarkButton({
  language,
  sectionSlug,
  isLoggedIn,
  initialActive,
  size = "sm",
}: SectionBookmarkButtonProps) {
  const { pathname } = useLocation();
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // セクション一覧ではカード全体がリンクになっているため、クリックがそちらに伝播しないようにする
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      setShowPrompt((prev) => !prev);
      return;
    }
    if (pending) return;

    setPending(true);
    setActive((prev) => !prev);
    await apiPost("/api/learn", { intent: "toggleManualTag", language, sectionSlug });
    setPending(false);
  }

  const shown = isLoggedIn && active;
  const { circle, icon } = SIZES[size];
  const redirectQuery = `redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="relative z-10 shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={shown}
        aria-label={shown ? "苦手セクションから外す" : "苦手セクションにする"}
        title={
          isLoggedIn
            ? shown
              ? "苦手セクションから外す"
              : "苦手セクションにする"
            : "ログインすると苦手セクションを記録できます"
        }
        className={`flex items-center justify-center rounded-full transition-colors disabled:opacity-60 ${circle} ${
          shown
            ? "bg-amber-100 text-amber-500 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
            : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
        }`}
      >
        <BookmarkIcon filled={shown} className={icon} />
      </button>

      {showPrompt &&
        !isLoggedIn &&
        createPortal(
          // ボタンの祖先（このコンポーネント自身のz-10ラッパーなど）が作るスタッキングコンテキストの
          // 内側に描画されると、ヘッダー（z-50）等より下に埋もれてしまうため、
          // document.body直下にポータルして画面全体を確実に覆うようにする
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowPrompt(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900"
            >
              <BookmarkIcon filled={false} className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-3 text-base font-medium text-zinc-800 dark:text-zinc-100">
                ログインして、ブックマーク機能を使ってみましょう！
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                苦手なセクションを記録して、復習に役立てられます。
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href={`/login?${redirectQuery}`}
                  className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  ログイン
                </Link>
                <Link
                  href={`/signup?${redirectQuery}`}
                  className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  新規登録
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                閉じる
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
