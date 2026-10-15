import { Outlet } from "react-router";

import { getLanguage } from "@/lib/shared/learn/languages";
import { SectionReviewControls } from "@/components/learn/SectionReviewControls";
import { SectionViewTracker } from "@/components/learn/SectionViewTracker";

const language = getLanguage("spanish");

// スペイン語セクション専用レイアウト（learn._<言語> のレイアウト）
export default function SpanishSectionLayout() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{language?.label}</p>
        <SectionReviewControls />
        <SectionViewTracker />
      </div>
      <div className="spanish-content mt-8 w-full max-w-3xl text-left">
        <Outlet />
      </div>
    </main>
  );
}
