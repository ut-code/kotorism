import { useMemo, useState } from "react";
import { useSwipe } from "@/hooks/useSwipe";
import Link from "@/components/Link";

import type { CardData } from "@/lib/shared/card-data";
import MultiElementCard from "@/components/my-notebooks/MultiElement";

type Card = { id: string; data: CardData };

// 暗記学習で実際に1枚のカード（多角柱）として出題する単位。
// 見出し語1件（1つのCard）が複数の意味・発音などを持つ場合でも、
// 従来は1枚のカードの1面に複数値を「/」区切りでまとめて表示していたが、
// それだと見にくいため「1組につき1枚のカード」に展開する。
// card.data.rowsは既に「同じ添字の値同士が列をまたいで対応する組」の配列
// （例: 訳と発音が同じ添字なら対応する意味・発音）になっているため、
// そのまま1組=1枚のStudyUnitとして使う
type StudyUnit = {
  card: Card;
  // 列名 → この組での値（見出し語列を除く。値が無い列はキー自体が存在しない）
  values: Record<string, string>;
};

function expandToUnits(card: Card, bodyColumns: string[]): StudyUnit[] {
  return card.data.rows.map((row) => {
    const values: Record<string, string> = {};
    for (const column of bodyColumns) {
      if (row[column] !== undefined) values[column] = row[column];
    }
    return { card, values };
  });
}

// StudyDeck（my-notebooks側）のFisher-Yatesシャッフルと同じロジック。
// 閲覧専用ページでは★・表示回数の記録は行わないため、それらに関わる部分だけを省いている
function shuffleOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function PublicStudyDeck({
  notebookId,
  columns,
  cards,
}: {
  notebookId: string;
  columns: string[];
  cards: Card[];
}) {
  // 見出し語1件（1つのCard）を、意味などの行数に応じて複数の出題単位（StudyUnit）に展開する
  const units = useMemo(() => {
    const bodyColumns = columns.slice(1);
    return cards.flatMap((card) => expandToUnits(card, bodyColumns));
  }, [cards, columns]);

  const [order, setOrder] = useState(() => units.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = units[order[index]];
  const currentCard = current.card;
  const frontColumn = columns[0] ?? "";

  // 指定した列の値を取得する。見出し語列はdata.head（1件）、
  // それ以外はcurrent.values[列名]（この行に割り当てられた1件、無ければ無し）
  function valuesFor(column: string, isHead: boolean): string[] {
    if (isHead) return currentCard.data.head ? [currentCard.data.head] : [];
    const value = current.values[column];
    return value !== undefined ? [value] : [];
  }

  // 今のカードでデータが存在する列一覧（見出し語は先頭で固定）
  const activeColumns = columns.filter((col, idx) => valuesFor(col, idx === 0).length > 0);
  const bodyColumns = activeColumns.slice(1);

  // 表示しようとしているカードの要素数が3個以上の時だけ3Dモードにする判定
  const is3DMode = activeColumns.length >= 3;

  // 3D多角柱のそれぞれの面に入れるコンテンツの準備。
  // 展開済みのStudyUnitでは各列は必ず1件の値に揃っているため、そのまま表示する
  const faces = activeColumns.map((colName) => {
    const isHead = colName === columns[0];
    const values = valuesFor(colName, isHead);
    return (
      <div key={colName} className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
          {colName}
        </span>
        <span
          className={
            isHead
              ? "text-2xl font-semibold text-black dark:text-zinc-50"
              : "text-lg text-zinc-800 dark:text-zinc-200"
          }
        >
          {values[0] ?? "—"}
        </span>
      </div>
    );
  });

  function goNext() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, order.length - 1));
  }

  function goPrev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  function shuffle() {
    setOrder(shuffleOrder(units.length));
    setIndex(0);
    setFlipped(false);
  }

  // スマホ向け: カードを左へスワイプで次へ、右へスワイプで前へ
  const swipeHandlers = useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev });

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        {index + 1} / {order.length}
      </p>

      <div className="relative w-full max-w-md touch-pan-y" {...swipeHandlers}>
        {is3DMode ? (
          <div className="my-2 flex flex-col items-center gap-2">
            <MultiElementCard
              // 同じ見出し語の別の行（意味違い）へ移動したときも確実に再マウントさせ、
              // 直前の回転状態を引きずらないようにするため、unitsの位置（order[index]）をkeyにする
              key={order[index]}
              faces={faces}
              columnNames={activeColumns}
              width={320}
              height={220}
            />
            <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
              クリックして次の面へ回転（{activeColumns.length}角柱）
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-56 w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border border-black/[.08] bg-white p-8 text-center transition-colors hover:border-black/[.15] dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/[.25]"
          >
            {!flipped ? (
              <>
                <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
                  {frontColumn}
                </span>
                <span className="text-2xl font-semibold text-black dark:text-zinc-50">
                  {currentCard.data.head || "—"}
                </span>
              </>
            ) : bodyColumns.length > 0 ? (
              <div className="flex flex-col gap-4">
                {bodyColumns.map((column) => {
                  const value = current.values[column];
                  if (value === undefined) return null;
                  return (
                    <div key={column}>
                      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
                        {column}
                      </p>
                      <p className="text-lg text-black dark:text-zinc-50">{value}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">他に項目がありません</p>
            )}
            <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
              クリックして{flipped ? "表" : "裏"}を見る
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:border-black/[.15] disabled:opacity-40 dark:border-white/[.145] dark:hover:border-white/[.25]"
        >
          前へ
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:border-black/[.15] dark:border-white/[.145] dark:hover:border-white/[.25]"
        >
          シャッフル
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index === order.length - 1}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          次へ
        </button>
      </div>

      <Link
        href={`/share/${notebookId}`}
        className="text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
      >
        ← 単語帳に戻る
      </Link>
    </div>
  );
}
