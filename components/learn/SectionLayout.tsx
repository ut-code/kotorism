import { Outlet, useLocation } from "react-router";

import Link from "@/components/Link";
import type { SectionSummary } from "@/app/learn/content";
import { getLanguage } from "@/app/learn/languages";
import { SectionReviewControls } from "@/components/learn/SectionReviewControls";
import { SectionViewTracker } from "@/components/learn/SectionViewTracker";

// 学習教材のセクション（/learn/[language]/[sectionSlug]）に共通のレイアウト。各言語の layout.tsx から使う。
// 見出しと説明はセクションのページ自体には書かず、ページが export する title・description（app/learn/content.ts）から
// ここで表示する。本文・演習は枠で囲まず、背景に直接置く
export default function SectionLayout({
  languageSlug,
  sections,
  className = "",
}: {
  languageSlug: string;
  sections: SectionSummary[];
  // 言語ごとに足したいクラス（中国語の簡体字フォントなど）
  className?: string;
}) {
  const { pathname } = useLocation();
  const currentSlug = pathname.split("/")[3];
  const index = sections.findIndex((section) => section.sectionSlug === currentSlug);
  const current = index >= 0 ? sections[index] : null;

  return (
    <main className={`flex flex-1 flex-col items-center px-6 py-16 ${className}`}>
      <div className="flex w-full max-w-3xl items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {getLanguage(languageSlug)?.label}
        </p>
        <SectionReviewControls />
        <SectionViewTracker />
      </div>

      {current && (
        <header className="mt-6 w-full max-w-3xl text-left">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {current.title}
          </h1>
          {current.description && (
            <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">{current.description}</p>
          )}
        </header>
      )}

      <div className="learn-content mt-8 w-full max-w-3xl text-left">
        <Outlet />
      </div>

      {index >= 0 && (
        <SectionNav
          languageSlug={languageSlug}
          prev={sections[index - 1] ?? null}
          next={sections[index + 1] ?? null}
        />
      )}
    </main>
  );
}

// 前後のセクションへのリンク
function SectionNav({
  languageSlug,
  prev,
  next,
}: {
  languageSlug: string;
  prev: SectionSummary | null;
  next: SectionSummary | null;
}) {
  if (!prev && !next) return null;
  const linkClass =
    "group flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-zinc-200 px-5 py-4 transition-colors hover:border-tealblue-300 hover:bg-tealblue-50/50 dark:border-zinc-800 dark:hover:border-tealblue-700/60 dark:hover:bg-tealblue-950/30";

  return (
    <nav
      aria-label="前後のセクション"
      className="mt-16 flex w-full max-w-3xl flex-col gap-3 border-t border-zinc-200 pt-8 sm:flex-row dark:border-zinc-800"
    >
      {prev ? (
        <Link href={`/learn/${languageSlug}/${prev.sectionSlug}`} className={linkClass}>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">← 前のセクション</span>
          <span className="truncate text-sm font-medium text-zinc-800 group-hover:text-tealblue-700 dark:text-zinc-100 dark:group-hover:text-tealblue-300">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
      {next ? (
        <Link
          href={`/learn/${languageSlug}/${next.sectionSlug}`}
          className={`${linkClass} text-right`}
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">次のセクション →</span>
          <span className="truncate text-sm font-medium text-zinc-800 group-hover:text-tealblue-700 dark:text-zinc-100 dark:group-hover:text-tealblue-300">
            {next.title}
          </span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
    </nav>
  );
}
