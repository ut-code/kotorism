import { useState } from "react";
import Link from "@/components/Link";
import { useLocation } from "react-router";

import type { AllLanguageSections } from "@/lib/shared/learn/content";
import LearnTree from "@/components/LearnTree";

import AuthNavLinks from "@/components/auth/AuthNavLinks";
import LogoutButton from "@/components/auth/LogoutButton";

export type HeaderNavLink = {
  href: string;
  label: string;
  hoverClassName: string;
};

type HeaderNavClientProps = {
  links: HeaderNavLink[];
  // ログイン中のユーザー名。未ログインならnull
  userName: string | null;
  // 学習教材の章ツリー用。/learn 配下でメニューに展開する
  allSections: AllLanguageSections;
};

// ヘッダー右側のナビゲーション。PCではリンクを横並びで表示し、
// スマホではハンバーガーメニューにまとめて、タップしやすい縦並びにする
export default function HeaderNavClient({ links, userName, allSections }: HeaderNavClientProps) {
  const { pathname } = useLocation();
  const isLearnActive = pathname.startsWith("/learn");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ログイン状態に応じた表示。PC用・スマホ用に同じ内容を使い回す
  const renderAuth = () =>
    userName ? (
      <>
        <span className="hidden text-base text-zinc-500 sm:inline dark:text-zinc-400">
          {userName}
        </span>
        <LogoutButton />
      </>
    ) : (
      <AuthNavLinks />
    );

  return (
    <>
      {/* PC表示：ログイン状態を横並びにする（ナビ本体はHeader側で静的に描画される） */}
      <div className="hidden items-center gap-3 md:flex">{renderAuth()}</div>

      {/* スマホ表示：ハンバーガーボタン */}
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        title={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isMenuOpen}
        aria-controls="header-mobile-menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {isMenuOpen ? (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* スマホ表示：ハンバーガーメニューの中身（ヘッダー直下に展開） */}
      {isMenuOpen && (
        <div
          id="header-mobile-menu"
          // メニュー内のリンクからページ遷移する際、メニューを閉じる（イベントのバブリングを利用）
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setIsMenuOpen(false);
          }}
          className="absolute inset-x-0 top-full border-b border-black/[.08] bg-white px-6 py-4 shadow-lg md:hidden dark:border-white/[.145] dark:bg-zinc-900"
        >
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-lg px-3 py-2 text-base font-semibold tracking-[0.04em] text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 ${link.hoverClassName}`}
                >
                  {link.label}
                </Link>
                {/* /learn 配下では「学習教材」の下に章ツリーを展開する */}
                {link.href === "/learn" && isLearnActive && (
                  <div className="max-h-[50vh] overflow-y-auto">
                    <LearnTree allSections={allSections} />
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
            {renderAuth()}
          </div>
        </div>
      )}
    </>
  );
}
