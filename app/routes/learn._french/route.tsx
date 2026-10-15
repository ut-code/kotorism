import { Outlet } from "react-router";

import { getLanguage } from "@/learn/languages";
import { SectionReviewControls } from "@/components/learn/SectionReviewControls";
import { SectionViewTracker } from "@/components/learn/SectionViewTracker";
import { getSections } from "@/learn/content";

import SectionNav from "./SectionNav";
import type { Route } from "./+types/route";
//
const language = getLanguage("french");

// フランス語セクション専用レイアウト
// カード型コンテナで囲み、globals.css の .french-content で見出し・表・リストを装飾する
// （他言語は components/SectionLayout.tsx の共通レイアウトのまま）
export async function loader() {
  return { sections: await getSections("french") };
}

export default function FrenchSectionLayout({ loaderData }: Route.ComponentProps) {
  const { sections } = loaderData;
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{language?.label}</p>
        <SectionReviewControls />
        <SectionViewTracker />
      </div>
      <article className="french-content mt-8 w-full max-w-3xl rounded-2xl border border-black/[.08] bg-white p-8 text-left shadow-sm dark:border-white/[.145] dark:bg-zinc-950 sm:p-10">
        <Outlet />
      </article>
      <SectionNav sections={sections} />
    </main>
  );
}
