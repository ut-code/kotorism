"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { useLocation } from "react-router";
import { LANGUAGES } from "@/app/learn/languages";
import type { AllLanguageSections } from "@/app/learn/content";

type LearnTreeProps = {
  // 各言語のスラッグをキーとし、セクション情報の配列を値に持つオブジェクト
  allSections?: AllLanguageSections;
};

/**
 * 学習教材の「言語 → 章」ツリー。PCのサイドバーとスマホのハンバーガーメニューで共用する
 */
export default function LearnTree({ allSections = {} }: LearnTreeProps) {
  const { pathname } = useLocation();

  // 現在のURLパスから言語スラッグとセクションスラッグを抽出 (例: /learn/chinese/01 -> ["learn", "chinese", "01"])
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentLanguageSlug = pathSegments[0] === "learn" ? pathSegments[1] : undefined;
  const currentSectionSlug = pathSegments[0] === "learn" ? pathSegments[2] : undefined;

  // 各言語アコーディオンの開閉状態を管理するState (現在アクセス中の言語は初期状態で自動オープン)
  const [openLanguages, setOpenLanguages] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    LANGUAGES.forEach((lang) => {
      initial[lang.languageSlug] = lang.languageSlug === currentLanguageSlug;
    });
    return initial;
  });

  // 言語ごとのアコーディオン開閉を切り替えるハンドラー関数
  const toggleLanguage = (slug: string) => {
    setOpenLanguages((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  // 言語ページへ遷移する際は、セクション一覧を開いた状態にするハンドラー関数
  const openLanguage = (slug: string) => {
    setOpenLanguages((prev) => ({ ...prev, [slug]: true }));
  };

  return (
    <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
      {LANGUAGES.map((lang) => {
        const isLangActive = lang.languageSlug === currentLanguageSlug;
        const isLangOpen = !!openLanguages[lang.languageSlug];
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
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-tealblue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-tealblue-600"
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

            {isLangOpen && sections.length > 0 && (
              <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                {sections.map((section) => {
                  const isSectionActive =
                    isLangActive && section.sectionSlug === currentSectionSlug;

                  return (
                    <Link
                      key={section.sectionSlug}
                      href={`/learn/${lang.languageSlug}/${section.sectionSlug}`}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        isSectionActive
                          ? "bg-tealblue-600/10 text-tealblue-600 font-semibold dark:bg-tealblue-600/20 dark:text-tealblue-600"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-tealblue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-tealblue-600"
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
  );
}
