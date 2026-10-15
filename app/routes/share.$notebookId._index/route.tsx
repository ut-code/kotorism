import Link from "@/components/Link";
import { notFound } from "@/lib/server/http.server";

import { prisma } from "@/lib/server/prisma.server";
import { normalizeCardData } from "@/lib/shared/card-data";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import type { Route } from "./+types/route";

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

export async function loader({ params }: Route.LoaderArgs) {
  const { notebookId } = params;

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

  return {
    notebook: { id: notebook.id, title: notebook.title },
    meta: {
      title: notebook.title,
      cardCount: cards.length,
      // OGP画像などの相対URLを絶対URLにするための基準。アプリのオリジンは認証と同じ環境変数を使う
      ogImageUrl: new URL(
        `/share/${notebook.id}/opengraph-image`,
        process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      ).toString(),
    },
    columns,
    bodyColumns,
    cards,
  };
}

// 共有リンクをDiscordなどに貼ったときに、単語帳の名前・語数が表示されるようにする。
// 画像は同じ階層の opengraph-image.tsx が生成する。非公開・存在しないIDでは何も設定しない
export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [];
  const { title, cardCount, ogImageUrl } = loaderData.meta;
  const description = `${cardCount}語の単語帳 | ことりずむ`;
  return [
    { title: `${title} | ことりずむ` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "ことりずむ" },
    { property: "og:image", content: ogImageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImageUrl },
  ];
};

export default function SharedNotebookPage({ loaderData }: Route.ComponentProps) {
  const { notebook, columns, bodyColumns, cards } = loaderData;

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
