"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { useLocation } from "react-router";
import LearnTree from "@/components/LearnTree";
import type { AllLanguageSections } from "@/app/learn/content";

// Sidebarコンポーネントが受け取るプロップスの型定義
type SidebarProps = {
  // 各言語のスラッグをキーとし、セクション情報の配列を値に持つオブジェクト
  allSections?: AllLanguageSections;
};

/**
 * サイドバーコンポーネント（PC表示専用）
 *
 * スマホではヘッダーのハンバーガーメニューに同じ内容（My単語帳・学習教材・章ツリー）をまとめているため、
 * このコンポーネントは md 以上の画面でのみ表示する。
 *
 * - ルートパス（`/`）ではサイドバーを表示しない
 * - サイドバー全体の折りたたみ（完全閉じる・開く）機能
 * - 「学習教材」横のシェブロンボタンでの開閉制御
 */
export default function Sidebar({ allSections = {} }: SidebarProps) {
  const { pathname } = useLocation();

  const isMyNotebooksActive = pathname.startsWith("/my-notebooks");
  const isLearnActive = pathname.startsWith("/learn");
  const currentLanguageSlug =
    pathname.split("/").filter(Boolean)[0] === "learn"
      ? pathname.split("/").filter(Boolean)[1]
      : undefined;

  // サイドバー自体の折りたたみ状態、学習教材グループの開閉状態
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLearnOpen, setIsLearnOpen] = useState<boolean>(true);

  // TOPページ（/）ではサイドバーを表示しない (フック呼び出しの後に判定)
  if (pathname === "/") {
    return null;
  }

  // サイドバーが閉じられている場合の「開くボタン」
  if (!isSidebarOpen) {
    return (
      <div className="hidden border-black/[.08] bg-white p-3 md:block md:border-r dark:border-white/[.145] dark:bg-zinc-950">
        <button
          onClick={() => setIsSidebarOpen(true)}
          title="サイドバーを開く"
          aria-label="サイドバーを開く"
          className="flex items-center gap-2 rounded-lg border border-black/[.08] p-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/[.08] bg-white p-4 md:block md:min-h-[calc(100vh-73px)] dark:border-white/[.145] dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          メニュー
        </span>
        <button
          onClick={() => setIsSidebarOpen(false)}
          title="サイドバーを閉じる"
          aria-label="サイドバーを閉じる"
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        {/* 1. My単語帳 */}
        <Link
          href="/my-notebooks"
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            isMyNotebooksActive
              ? "bg-coral-500/10 text-coral-500 dark:bg-coral-500/20 dark:text-coral-500"
              : "text-zinc-700 hover:bg-zinc-100 hover:text-coral-500 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-coral-500"
          }`}
        >
          My単語帳
        </Link>

        {/* 2. 学習教材 */}
        <div>
          <div className="flex items-center justify-between">
            <Link
              href="/learn"
              onClick={() => setIsLearnOpen(true)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isLearnActive && !currentLanguageSlug
                  ? "bg-tealblue-600/10 text-tealblue-600 dark:bg-tealblue-600/20 dark:text-tealblue-600"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-tealblue-600 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-tealblue-600"
              }`}
            >
              学習教材
            </Link>
            <button
              type="button"
              onClick={() => setIsLearnOpen((prev) => !prev)}
              aria-expanded={isLearnOpen}
              aria-label="学習教材の言語一覧を開閉"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              <svg
                className={`h-4 w-4 transition-transform ${isLearnOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          {isLearnOpen && <LearnTree allSections={allSections} />}
        </div>
      </nav>
    </aside>
  );
}
