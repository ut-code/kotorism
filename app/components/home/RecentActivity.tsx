import Link from "@/components/Link";

// 最近見た単語帳・学習ページを並べて、すぐ学習を再開できるようにする（/history 用）。
// まだ何も見ていない場合は、はじめ方の案内を出す
export type RecentNotebook = { id: string; title: string };
export type RecentSection = { href: string; languageLabel: string; title: string };

export default function RecentActivity({
  notebooks,
  sections,
}: {
  notebooks: RecentNotebook[];
  sections: RecentSection[];
}) {
  if (notebooks.length === 0 && sections.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        まだ閲覧履歴がありません。
        <Link href="/my-notebooks" className="underline">
          My単語帳
        </Link>
        や
        <Link href="/learn" className="underline">
          学習教材
        </Link>
        を開くと、ここに表示されます。
      </p>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6 sm:flex-row">
      {notebooks.length > 0 && (
        <div className="flex-1">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-coral-900 dark:text-coral-100">
            My単語帳
          </h2>
          <ul className="flex flex-col gap-2">
            {notebooks.map((notebook) => (
              <li key={notebook.id}>
                <Link
                  href={`/my-notebooks/${notebook.id}`}
                  className="block rounded-2xl border border-coral-200 bg-white px-5 py-3 text-left font-medium text-black transition-all hover:-translate-y-0.5 hover:border-coral-300 hover:shadow-lg hover:shadow-coral-100 dark:border-coral-800 dark:bg-coral-900/60 dark:text-zinc-50 dark:hover:border-coral-500 dark:hover:bg-coral-900/80 dark:hover:shadow-none"
                >
                  {notebook.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sections.length > 0 && (
        <div className="flex-1">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-tealblue-900 dark:text-tealblue-100">
            学習教材
          </h2>
          <ul className="flex flex-col gap-2">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-2xl border border-tealblue-200 bg-white px-5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-tealblue-300 hover:shadow-lg hover:shadow-tealblue-100 dark:border-tealblue-600 dark:bg-tealblue-900 dark:hover:border-tealblue-400 dark:hover:bg-tealblue-800 dark:hover:shadow-none"
                >
                  <span className="mr-2 text-xs text-zinc-500 dark:text-tealblue-200">
                    {section.languageLabel}
                  </span>
                  <span className="font-medium text-black dark:text-zinc-50">{section.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
