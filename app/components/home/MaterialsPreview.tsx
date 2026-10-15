import Link from "@/components/Link";

interface LanguageLink {
  key: string;
  label: string;
  href: string;
}

const LANGUAGES: LanguageLink[] = [
  { key: "chinese", label: "中国語", href: "/learn/chinese" },
  { key: "french", label: "フランス語", href: "/learn/french" },
  { key: "german", label: "ドイツ語", href: "/learn/german" },
  { key: "spanish", label: "スペイン語", href: "/learn/spanish" },
];

// 学習教材カードの下段に、4言語のボタンを並べる（カードが横並びで狭くなるPC幅では2列×2段）。
// ボタンを押すと、その言語の教材ページへ直接移動する（ボタン以外の余白はカード全体のリンクで/learnへ）
export function MaterialsPreview() {
  return (
    <div className="pointer-events-none relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-2 md:self-center">
      {LANGUAGES.map((lang) => (
        <Link
          key={lang.key}
          href={lang.href}
          className="group/lang pointer-events-auto flex min-h-16 items-center justify-between gap-2 rounded-2xl border border-tealblue-200 bg-tealblue-50 px-[18px] py-3.5 text-base font-bold text-tealblue-900 transition-all hover:-translate-y-0.5 hover:border-tealblue-300 hover:bg-tealblue-100 dark:border-tealblue-700/70 dark:bg-tealblue-900/60 dark:text-tealblue-50 dark:hover:border-tealblue-500 dark:hover:bg-tealblue-800/80"
        >
          {lang.label}
          <span
            aria-hidden="true"
            className="text-tealblue-600 transition-transform group-hover/lang:translate-x-1 dark:text-tealblue-300"
          >
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
