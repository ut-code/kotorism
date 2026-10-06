import Link from "next/link";

import { getRecentNotebooks, getRecentSections } from "@/lib/recent-activity";
import { getCurrentUser } from "@/lib/session";

// ログイン中のユーザーに、最近使った単語帳・学習ページを並べて、すぐ学習を再開できるようにする。
// 未ログイン、またはまだ何も使っていない場合は何も描画しない。
// セッションを参照するため、呼び出し側でSuspenseに包んでトップページ全体が動的にならないようにする
export default async function RecentActivity() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [notebooks, sections] = await Promise.all([
    getRecentNotebooks(user.id),
    getRecentSections(user.id),
  ]);
  if (notebooks.length === 0 && sections.length === 0) return null;

  return (
    <section className="flex w-full max-w-5xl flex-col gap-6 px-6 pb-12 sm:flex-row">
      {notebooks.length > 0 && (
        <div className="flex-1">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-coral-900 uppercase dark:text-coral-100">
            最近使った単語帳
          </h2>
          <ul className="flex flex-col gap-2">
            {notebooks.map((notebook) => (
              <li key={notebook.id}>
                <Link
                  href={`/my-notebooks/${notebook.id}/study`}
                  className="block rounded-2xl border border-coral-200 bg-white px-5 py-3 text-left font-medium text-black transition-all hover:-translate-y-0.5 hover:border-coral-300 hover:shadow-lg hover:shadow-coral-100 dark:border-coral-900/40 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-coral-700/60 dark:hover:shadow-none"
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
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-tealblue-900 uppercase dark:text-tealblue-100">
            最近使った学習ページ
          </h2>
          <ul className="flex flex-col gap-2">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-2xl border border-tealblue-200 bg-white px-5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-tealblue-300 hover:shadow-lg hover:shadow-tealblue-100 dark:border-tealblue-900/40 dark:bg-zinc-950 dark:hover:border-tealblue-700/60 dark:hover:shadow-none"
                >
                  <span className="mr-2 text-xs text-zinc-500 dark:text-zinc-400">
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
