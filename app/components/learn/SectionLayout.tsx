import { Outlet, useLocation } from "react-router";

import BackLink from "@/components/learn/BackLink";
import type { SectionSummary } from "@/lib/shared/learn/content";
import { getLanguage } from "@/lib/shared/learn/languages";
import { SectionReviewControls } from "@/components/learn/SectionReviewControls";
import { SectionViewTracker } from "@/components/learn/SectionViewTracker";

// 学習教材のセクション（/learn/[language]/[sectionSlug]）に共通のレイアウト。各言語のレイアウト(app/routes/learn._<言語>/route.tsx)から使う。
// 見出しと説明はセクションのページ自体には書かず、ページが export する title・description（app/lib/shared/learn/content.ts）から
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
  const current = sections.find((section) => section.sectionSlug === currentSlug) ?? null;

  return (
    <main className={`flex flex-1 flex-col items-center px-6 py-16 ${className}`}>
      <div className="w-full max-w-3xl">
        <BackLink href={`/learn/${languageSlug}`}>学習教材一覧に戻る</BackLink>
      </div>

      <div className="mt-4 flex w-full max-w-3xl items-center justify-between">
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
    </main>
  );
}
