import Link from "@/components/Link";
import { PrismList } from "@/components/home/PrismList";
import type { AllLanguageSections } from "@/lib/shared/learn/content";
import { LANGUAGES } from "@/lib/shared/learn/languages";

// 学習教材のページに、言語ごとの教材のセクションの題名を本の目次のように並べる（PC幅では2列×2段）。
// 題名は各セクションのページが export している title（getAllLanguageSections）をそのまま使い、実際の教材とずれないようにする。
// 言語名を押すと、その言語の教材ページへ移動する
export function MaterialsContents({ sections }: { sections: AllLanguageSections }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
      {LANGUAGES.map((lang) => (
        <section key={lang.languageSlug}>
          <h3>
            <Link
              href={`/learn/${lang.languageSlug}`}
              className="group/lang flex items-center justify-between border-b-2 border-tealblue-300 pb-1.5 text-lg font-bold text-tealblue-900 dark:border-tealblue-700 dark:text-tealblue-100"
            >
              {lang.label}
              <span
                aria-hidden="true"
                className="text-tealblue-600 transition-transform group-hover/lang:translate-x-1 dark:text-tealblue-300"
              >
                →
              </span>
            </Link>
          </h3>
          <PrismList
            items={(sections[lang.languageSlug] ?? []).map((section) => section.title)}
            className="text-[13px] leading-8 text-zinc-600 dark:text-zinc-400"
            tone="tealblue"
            ruleOffset={5}
            marker={false}
          />
        </section>
      ))}
    </div>
  );
}
