import Link from "@/components/Link";

import { LANGUAGES } from "./languages";
import { getAllLanguageSections } from "./content";
import type { Route } from "./+types/page";

export async function loader() {
  const languageSlugs = LANGUAGES.map((lang) => lang.languageSlug);
  const allSections = await getAllLanguageSections(languageSlugs);

  return { allSections };
}

export default function LearnPage({ loaderData }: Route.ComponentProps) {
  const { allSections } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          学習教材
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          学びたい言語を選択してください。
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {LANGUAGES.map((language) => {
          const sections = allSections[language.languageSlug] || [];
          const count = sections.length;

          return (
            <Link
              key={language.languageSlug}
              href={`/learn/${language.languageSlug}`}
              className="group flex items-center justify-between rounded-2xl border border-tealblue-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-tealblue-300 hover:shadow-xl hover:shadow-tealblue-100 dark:border-tealblue-900/40 dark:bg-zinc-950 dark:hover:border-tealblue-700/60 dark:hover:shadow-none"
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {language.label}
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {count > 0 ? `${count} セクション` : "準備中"}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-tealblue-50 group-hover:text-tealblue-600 dark:bg-zinc-900 dark:text-zinc-500 dark:group-hover:bg-tealblue-950/60 dark:group-hover:text-tealblue-400">
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
