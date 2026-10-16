import Link from "@/components/Link";
import LanguageFlag from "@/components/learn/LanguageFlag";

import { LANGUAGES } from "@/lib/shared/learn/languages";
import { LANGUAGE_INTROS } from "@/lib/shared/learn/language-intros";
import { getAllLanguageSections } from "@/lib/shared/learn/content";
import type { Route } from "./+types/route";

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

      <ul className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {LANGUAGES.map((language) => {
          const count = (allSections[language.languageSlug] ?? []).length;
          const intro = LANGUAGE_INTROS[language.languageSlug];
          const descriptionId = `language-intro-${language.languageSlug}`;

          return (
            <li key={language.languageSlug}>
              <Link
                href={`/learn/${language.languageSlug}`}
                aria-describedby={intro ? descriptionId : undefined}
                // ホバー中は下に出る紹介が隣のカードより手前に来るよう z-index を上げる
                className="group relative flex items-center justify-between gap-4 rounded-2xl border border-tealblue-200 bg-white p-6 transition-all hover:z-20 hover:-translate-y-1 hover:border-tealblue-300 hover:shadow-xl hover:shadow-tealblue-100 focus-visible:z-20 dark:border-tealblue-900/40 dark:bg-zinc-950 dark:hover:border-tealblue-700/60 dark:hover:shadow-none"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <LanguageFlag
                    languageSlug={language.languageSlug}
                    className="h-9 w-[3.375rem] shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
                  />
                  <div className="flex min-w-0 flex-col gap-1 text-left">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {language.label}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {intro && <>{intro.nativeName} ・ </>}
                      {count > 0 ? `${count} セクション` : "準備中"}
                    </span>
                  </div>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-tealblue-50 group-hover:text-tealblue-600 dark:bg-zinc-900 dark:text-zinc-500 dark:group-hover:bg-tealblue-950/60 dark:group-hover:text-tealblue-400">
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* 言語の紹介。ホバー中（キーボード操作ではフォーカス中）だけカードの下に浮かべて表示する。
                    読み上げでは aria-describedby で常にカードの説明として読まれる */}
                {intro && (
                  <div
                    id={descriptionId}
                    className="pointer-events-none invisible absolute inset-x-0 top-full mt-2 translate-y-1 rounded-2xl border border-tealblue-200 bg-white p-4 text-left opacity-0 shadow-xl shadow-tealblue-100/60 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:border-tealblue-900/60 dark:bg-zinc-900 dark:shadow-none"
                  >
                    <div
                      className="mb-1.5 font-serif text-sm text-tealblue-700 dark:text-tealblue-300"
                      lang={language.languageSlug === "chinese" ? "zh" : undefined}
                    >
                      {intro.greeting}
                      {intro.greetingReading && (
                        <span className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {intro.greetingReading}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {intro.description}
                    </p>
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
