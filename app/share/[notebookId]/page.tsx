import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { normalizeCardData } from "@/lib/card-data";
import { normalizeColumns } from "@/lib/notebook-columns";

// 公開中の単語帳をログイン無しで閲覧できるページ。公開状態はDBの最新値を都度見る必要があるため静的化しない
export const dynamic = "force-dynamic";

// Excelの結合セルのように、ある列で連続する組（行）の値が同じであればまとめてrowSpanで
// 1つのセルにする。先頭行以外は0を返し、呼び出し側でそのセルの描画をスキップする。
// 空文字同士は結合しない（未入力のセルが1つの大きな空欄に見えて紛らわしいのを避けるため）
function computeRowSpans(values: string[]): number[] {
  const spans = values.map(() => 1);
  for (let i = values.length - 1; i > 0; i -= 1) {
    if (values[i] !== "" && values[i] === values[i - 1]) {
      spans[i - 1] += spans[i];
      spans[i] = 0;
    }
  }
  return spans;
}

// 共有リンクをDiscordなどに貼ったときに、単語帳の名前・語数が表示されるようにする。
// 画像は同じ階層の opengraph-image.tsx が生成する。非公開・存在しないIDでは何も設定しない
export async function generateMetadata(props: PageProps<"/share/[notebookId]">): Promise<Metadata> {
  const { notebookId } = await props.params;
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId, isPublic: true },
    select: { title: true, _count: { select: { cards: true } } },
  });
  if (!notebook) return {};

  const description = `${notebook._count.cards}語の単語帳 | ことりずむ`;
  return {
    title: `${notebook.title} | ことりずむ`,
    description,
    openGraph: { title: notebook.title, description, type: "website", siteName: "ことりずむ" },
    twitter: { card: "summary_large_image", title: notebook.title, description },
  };
}

export default async function SharedNotebookPage(props: PageProps<"/share/[notebookId]">) {
  const { notebookId } = await props.params;

  // isPublicな単語帳のみ取得する。非公開・存在しないIDの場合は404にする
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId, isPublic: true },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  if (!notebook) {
    notFound();
  }

  const columns = normalizeColumns(notebook.columns);
  const bodyColumns = columns.slice(1);
  const cards = notebook.cards.map((card) => ({ id: card.id, data: normalizeCardData(card.data) }));

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <p className="text-sm text-zinc-500 dark:text-zinc-500">共有された単語帳（閲覧専用）</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {notebook.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{cards.length}語</p>
          </div>
          {cards.length > 0 && (
            <Link
              href={`/share/${notebook.id}/study`}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              暗記学習を始める
            </Link>
          )}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full min-w-max border-collapse text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-500"
                  >
                    まだ単語がありません。
                  </td>
                </tr>
              ) : (
                cards.flatMap((card) => {
                  // Excelの結合セルのように、見出し語セルは組（rows）の件数ぶんrowSpanでまたがらせ、
                  // 本文の各列は連続して同じ値が続く区間だけをrowSpanでまとめる
                  const rowCount = card.data.rows.length;
                  const bodySpansByColumn = bodyColumns.map((column) =>
                    computeRowSpans(card.data.rows.map((row) => row[column] ?? "")),
                  );

                  return card.data.rows.map((row, rowIndex) => (
                    <tr
                      key={`${card.id}:${rowIndex}`}
                      className="border-t border-black/[.06] dark:border-white/[.1]"
                    >
                      {rowIndex === 0 && (
                        <td
                          rowSpan={rowCount}
                          className="px-4 py-3 align-top text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          {card.data.head}
                        </td>
                      )}
                      {bodyColumns.map((column, columnIndex) => {
                        const span = bodySpansByColumn[columnIndex][rowIndex];
                        if (span === 0) return null;
                        return (
                          <td
                            key={column}
                            rowSpan={span}
                            className="px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            {row[column] ?? ""}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
