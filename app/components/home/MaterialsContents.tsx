import { useState } from "react";

import Link from "@/components/Link";
import { PrismList } from "@/components/home/PrismList";
import type { AllLanguageSections } from "@/lib/shared/learn/content";
import { LANGUAGES } from "@/lib/shared/learn/languages";

// 学習教材のページに、言語ごとの教材のセクションの題名を本の目次のように並べる（PC幅では2列×2段）。
// 題名は各セクションのページが export している title（getAllLanguageSections）をそのまま使い、実際の教材とずれないようにする。
// 言語名を押すと、その言語の教材ページへ移動する。
// スマホでは全部並べるとトップが縦に長くなりすぎるので、言語名とセクション数だけを出し、押すと題名を開く
export function MaterialsContents({ sections }: { sections: AllLanguageSections }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
      {LANGUAGES.map((lang) => (
        <LanguageContents
          key={lang.languageSlug}
          languageSlug={lang.languageSlug}
          label={lang.label}
          titles={(sections[lang.languageSlug] ?? []).map((section) => section.title)}
        />
      ))}
    </div>
  );
}

function LanguageContents({
  languageSlug,
  label,
  titles,
}: {
  languageSlug: string;
  label: string;
  titles: string[];
}) {
  // スマホで題名を開いているか（PC幅では常に開いている）
  const [open, setOpen] = useState(false);
  const listId = `materials-${languageSlug}`;
  return (
    <section>
      {/* スマホ：押すと題名を開く */}
      <h3 className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-full items-center justify-between border-b-2 border-tealblue-300 pb-1.5 text-left text-lg font-bold text-tealblue-900 dark:border-tealblue-700 dark:text-tealblue-100"
        >
          <span>
            {label}
            <span className="ml-2 text-sm font-normal text-zinc-600 dark:text-zinc-400">
              {titles.length}セクション
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`text-sm text-tealblue-600 transition-transform dark:text-tealblue-300 ${open ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
      </h3>
      {/* PC：言語名から教材ページへ */}
      <h3 className="hidden md:block">
        <Link
          href={`/learn/${languageSlug}`}
          className="group/lang flex items-center justify-between border-b-2 border-tealblue-300 pb-1.5 text-lg font-bold text-tealblue-900 dark:border-tealblue-700 dark:text-tealblue-100"
        >
          {label}
          <span
            aria-hidden="true"
            className="text-tealblue-600 transition-transform group-hover/lang:translate-x-1 dark:text-tealblue-300"
          >
            →
          </span>
        </Link>
      </h3>
      <div id={listId} className={open ? "" : "hidden md:block"}>
        <PrismList
          items={titles}
          className="text-[13px] leading-8 text-zinc-600 dark:text-zinc-400"
          tone="tealblue"
          ruleOffset={5}
          marker={false}
        />
        <Link
          href={`/learn/${languageSlug}`}
          className="mt-2 inline-block text-sm font-bold text-tealblue-700 md:hidden dark:text-tealblue-300"
        >
          {label}の教材を開く →
        </Link>
      </div>
    </section>
  );
}
