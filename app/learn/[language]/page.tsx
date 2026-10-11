import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SectionCard } from "@/components/learn/SectionCard";
import { getLanguage, LANGUAGES } from "../languages";
import { getSections } from "../content";

// ルート生成の補助関数
export function generateStaticParams() {
  return LANGUAGES.map((language) => ({ language: language.languageSlug }));
}

export default async function LearnLanguagePage(
  // pageファイルのデフォルトコンポーネントには、propsとしてparams及びsearchParamsが自動的に渡される
  // paramsは、URLパスの [...] 部分（動的セグメントと呼ぶ）である
  // searchParamsは、URLの?key=value の部分（クエリパラメータと呼び、まだ使用していない）である
  // PagePropsは、params及びsearchParamsの型を定義するためのグローバルに用いることができる型である
  // <"/learn/[language]">の部分は、PagePropsの型引数であり、params及びsearchParamsの型を自動的に推論するために使用される
  props: PageProps<"/learn/[language]">,
) {
  const { language: languageSlug } = await props.params;
  const language = getLanguage(languageSlug);

  if (!language) {
    notFound();
  }

  const sections = await getSections(language.languageSlug);

  const user = await requireUser();
  const progressRows = await prisma.sectionProgress.findMany({
    where: { userId: user.id, language: language.languageSlug },
  });
  const progressBySlug = new Map(progressRows.map((row) => [row.sectionSlug, row]));

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-3xl">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          学習教材一覧に戻る
        </Link>
      </div>

      <div className="mt-4 w-full max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {language.label}の学習教材
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          学びたいセクションを選んでください。
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section, index) => {
          const progress = progressBySlug.get(section.sectionSlug);
          return (
            <SectionCard
              key={section.sectionSlug}
              href={`/learn/${language.languageSlug}/${section.sectionSlug}`}
              index={index}
              title={section.title}
              language={language.languageSlug}
              sectionSlug={section.sectionSlug}
              isLoggedIn={!!user}
              manuallyTagged={progress?.manuallyTagged ?? false}
            />
          );
        })}
      </div>
    </main>
  );
}
