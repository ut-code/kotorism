"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGUAGES } from "@/app/learn/languages";
import { AllLanguageSections } from "@/app/learn/content";

// Sidebarコンポーネントが受け取るプロップスの型定義
type SidebarProps = {
  // 各言語のスラッグをキーとし、セクション情報の配列を値に持つオブジェクト
  allSections?: AllLanguageSections;
};

/**
 * サイドバーコンポーネント
 *
 * 階層構造:
 * 1. My単語帳
 * 2. 学習教材
 *    └── 各言語 (中国語、フランス語、ドイツ語、スペイン語など)
 *         └── 各セクション (01, 02 などの章)
 *
 * 画面上の機能:
 * - ルートパス（`/`）等ではサイドバーを表示しない自動判定
 * - サイドバー全体の折りたたみ（完全閉じる・開く）機能
 * - 「学習教材」「各言語」横のシェブロンボタンでの開閉制御 (State管理)
 * - usePathnameによるアクティブなルートの判定と視覚的ハイライト (色付け)
 */
export default function Sidebar({ allSections = {} }: SidebarProps) {
  // 現在のページURLパスを取得
  const pathname = usePathname();

  // ルートパスに基づく大枠の判定 (My単語帳 または 学習教材 が選択中か)
  const isMyNotebooksActive = pathname.startsWith("/my-notebooks");
  const isLearnActive = pathname.startsWith("/learn");

  // 現在のURLパスから言語スラッグとセクションスラッグを抽出 (例: /learn/chinese/01 -> ["learn", "chinese", "01"])
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentLanguageSlug = pathSegments[0] === "learn" ? pathSegments[1] : undefined;
  const currentSectionSlug = pathSegments[0] === "learn" ? pathSegments[2] : undefined;

  // React Hooks の呼び出しルールを守るため、条件分岐より前にすべてのフックを呼び出す
  // サイドバー自体の折りたたみ状態を管理するState（PC表示用）
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // スマホ表示でのセクション一覧の開閉状態。ヘッダーのメニューと役割が被らないよう、初期状態は閉じておく
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // 大枠グループのアコーディオン開閉状態を管理するState
  const [isLearnOpen, setIsLearnOpen] = useState<boolean>(true);

  // 各言語アコーディオンの開閉状態を管理するState (現在アクセス中の言語は初期状態で自動オープン)
  const [openLanguages, setOpenLanguages] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    LANGUAGES.forEach((lang) => {
      initial[lang.languageSlug] = lang.languageSlug === currentLanguageSlug;
    });
    return initial;
  });

  // TOPページ（/）ではサイドバーを表示しない (フック呼び出しの後に判定)
  if (pathname === "/") {
    return null;
  }

  // 言語ごとのアコーディオン開閉を切り替えるハンドラー関数
  const toggleLanguage = (slug: string) => {
    setOpenLanguages((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  // 言語ページへ遷移する際は、セクション一覧を開いた状態にするハンドラー関数
  const openLanguage = (slug: string) => {
    setOpenLanguages((prev) => ({ ...prev, [slug]: true }));
  };

  // スマホ表示専用の開閉ボタン。ヘッダーのハンバーガーメニュー（My単語帳・学習教材への導線）とは別に、
  // 学習教材の章一覧だけを開閉する。アイコンの重複を避けるため、ハンバーガーではなくリスト風のアイコンを使う
  const mobileToggle = isLearnActive ? (
    <div className="border-b border-black/[.08] bg-white px-4 py-2 md:hidden dark:border-white/[.145] dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-expanded={isMobileOpen}
        aria-controls="learn-sections-nav"
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <span className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            />
          </svg>
          章の一覧
        </span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${isMobileOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  ) : null;

  // サイドバーが閉じられている場合の「開くボタン」を表示（PC表示のみ）
  if (!isSidebarOpen) {
    return (
      <>
        {mobileToggle}
        <div className="hidden p-3 border-b border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950 md:block md:border-r md:border-b-0">
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
      </>
    );
  }

  return (
    <>
      {mobileToggle}
      <aside
        id="learn-sections-nav"
        // スマホでは章の一覧を開いている間だけ表示する。リンクをタップして遷移したら閉じる（イベントのバブリングを利用）
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setIsMobileOpen(false);
        }}
        className={`${isMobileOpen && isLearnActive ? "block" : "hidden"} w-full shrink-0 border-b border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950 md:block md:w-64 md:border-r md:border-b-0 md:min-h-[calc(100vh-73px)]`}
      >
        {/* サイドバーヘッダー（全体の折りたたみボタン。スマホでは使わない） */}
        <div className="mb-4 hidden items-center justify-between pb-2 border-b border-zinc-100 md:flex dark:border-zinc-900">
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
          {/* ==================== 1. My単語帳 グループ（スマホではヘッダーのメニューにあるため非表示） ==================== */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              <Link
                href="/my-notebooks"
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isMyNotebooksActive
                    ? "bg-[#FF7F50]/10 text-[#FF7F50] dark:bg-[#FF7F50]/20 dark:text-[#FF7F50]"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-[#FF7F50] dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-[#FF7F50]"
                }`}
              >
                My単語帳
              </Link>
            </div>
          </div>

          {/* ==================== 2. 学習教材 グループ ==================== */}
          <div>
            {/* スマホではヘッダーのメニューに「学習教材」があるため、この行は非表示にして言語一覧だけ見せる */}
            <div className="hidden items-center justify-between md:flex">
              <Link
                href="/learn"
                onClick={() => setIsLearnOpen(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isLearnActive && !currentLanguageSlug
                    ? "bg-[#367588]/10 text-[#367588] dark:bg-[#367588]/20 dark:text-[#367588]"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-[#367588] dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-[#367588]"
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

            {/* ==================== 2-1. 各言語の階層 ==================== */}
            {isLearnOpen && (
              <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                {LANGUAGES.map((lang) => {
                  // 現在選択されている言語かどうか
                  const isLangActive = lang.languageSlug === currentLanguageSlug;
                  // 当該言語のアコーディオンが開いているかどうか
                  const isLangOpen = !!openLanguages[lang.languageSlug];
                  // 当該言語に属するセクション（章）リスト
                  const sections = allSections[lang.languageSlug] || [];

                  return (
                    <div key={lang.languageSlug}>
                      <div className="flex items-center justify-between">
                        {/* 言語名のリンク（クリックで言語ページへ遷移し、セクション一覧を開く） */}
                        <Link
                          href={`/learn/${lang.languageSlug}`}
                          onClick={() => openLanguage(lang.languageSlug)}
                          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            isLangActive && !currentSectionSlug
                              ? "bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-[#367588] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-[#367588]"
                          }`}
                        >
                          {lang.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleLanguage(lang.languageSlug)}
                          aria-expanded={isLangOpen}
                          aria-label={`${lang.label}のセクション一覧を開閉`}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${isLangOpen ? "rotate-90" : ""}`}
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

                      {/* ==================== 2-2. 各セクション（項目）の階層 ==================== */}
                      {isLangOpen && sections.length > 0 && (
                        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                          {sections.map((section) => {
                            // 現在選択されているセクションかどうか
                            const isSectionActive =
                              isLangActive && section.sectionSlug === currentSectionSlug;

                            return (
                              <Link
                                key={section.sectionSlug}
                                href={`/learn/${lang.languageSlug}/${section.sectionSlug}`}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                  isSectionActive
                                    ? "bg-[#367588]/10 text-[#367588] font-semibold dark:bg-[#367588]/20 dark:text-[#367588]"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-[#367588] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-[#367588]"
                                }`}
                              >
                                {section.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
