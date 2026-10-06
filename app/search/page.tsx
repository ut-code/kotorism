import Link from "next/link";

import HeaderSearch from "@/components/HeaderSearch";
import { searchNotebooks, searchSections } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

// 検索結果はログイン状態と最新のDBに依存するため、静的化しない
export const dynamic = "force-dynamic";

const sectionTitleClassName =
  "mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500";
const itemClassName =
  "block rounded-xl border border-black/[.08] bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900";

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const user = await getCurrentUser();
  const [sections, found] = await Promise.all([
    searchSections(query),
    user ? searchNotebooks(user.id, query) : null,
  ]);
  const notebooks = found?.notebooks ?? [];
  const cards = found?.cards ?? [];
  const total = sections.length + notebooks.length + cards.length;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">検索</h1>
        {/* ヘッダーの検索欄はスマホではメニュー内にあるため、このページにも置いて再検索しやすくする */}
        <HeaderSearch className="mt-4" />

        {query === "" ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            キーワードを入力して、単語帳の単語や学習教材を検索できます。
          </p>
        ) : (
          <>
            <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
              「{query}」の検索結果: {total}件
            </p>

            {!user && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                <Link href="/login" className="underline">
                  ログイン
                </Link>
                すると、My単語帳の単語も検索できます。
              </p>
            )}

            {notebooks.length > 0 && (
              <section className="mt-8">
                <h2 className={sectionTitleClassName}>単語帳</h2>
                <ul className="flex flex-col gap-2">
                  {notebooks.map((notebook) => (
                    <li key={notebook.id}>
                      <Link href={`/my-notebooks/${notebook.id}`} className={itemClassName}>
                        {notebook.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {cards.length > 0 && (
              <section className="mt-8">
                <h2 className={sectionTitleClassName}>単語</h2>
                <ul className="flex flex-col gap-2">
                  {cards.map((card) => (
                    <li key={card.cardId}>
                      <Link href={`/my-notebooks/${card.notebookId}`} className={itemClassName}>
                        <span className="font-medium text-black dark:text-zinc-50">
                          {card.head}
                        </span>
                        {card.matched !== card.head && (
                          <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {card.matched}
                          </span>
                        )}
                        <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-500">
                          {card.notebookTitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {found?.truncated && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    件数が多いため、先頭の{cards.length}
                    件のみ表示しています。キーワードを絞り込んでください。
                  </p>
                )}
              </section>
            )}

            {sections.length > 0 && (
              <section className="mt-8">
                <h2 className={sectionTitleClassName}>学習教材</h2>
                <ul className="flex flex-col gap-2">
                  {sections.map((section) => (
                    <li key={section.href}>
                      <Link href={section.href} className={itemClassName}>
                        <span className="mr-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {section.languageLabel}
                        </span>
                        <span className="font-medium text-black dark:text-zinc-50">
                          {section.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {total === 0 && (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                一致するものが見つかりませんでした。
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
