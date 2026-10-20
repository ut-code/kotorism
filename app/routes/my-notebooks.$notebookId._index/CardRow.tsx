import { useState } from "react";
import { useFetcher, useSubmit } from "react-router";

import EyeIcon from "@/components/EyeIcon";
import type { LongPressDragHandlers } from "@/hooks/useLongPressDrag";
import StarIcon from "@/components/StarIcon";
import StarCountEditor from "@/components/StarCountEditor";
import { useStarColors } from "@/hooks/useStarColors";
import { bulkCardFieldName } from "@/lib/shared/bulk-edit";
import { CARD_HEAD_MAX_LENGTH, CARD_VALUE_MAX_LENGTH } from "@/lib/shared/notebook-schema";
import { starColorFor } from "@/lib/shared/star-colors";
import { displayedStarCount } from "@/lib/shared/star-progress";
import type { CardData } from "@/lib/shared/card-data";
import DraggableTr from "./DraggableTr";

// 表全体の編集中の入力欄（編集中に足した新しい行の入力欄でも使う）
export const editInputClassName =
  "w-full min-w-16 rounded border border-black/[.1] bg-transparent px-2 py-1 text-sm outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]";

// Excelの結合セルのように、ある列で連続する組（行）の値が同じであればまとめてrowSpanで
// 1つのセルにする。先頭行以外はnull（描画しない）を返し、代わりに直前のセルのrowSpanを伸ばす。
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

export default function CardRow({
  index,
  notebookId,
  columns,
  card,
  bulkEditFormId,
  drag,
  dragDisabled,
  isDragSource,
}: {
  // 表の中で何番目の単語か（並べ替えで、どの単語の行かを見分けるのに使う）
  index: number;
  notebookId: string;
  columns: string[];
  card: { id: string; data: CardData; starred: boolean; starCount: number; viewCount: number };
  // 表全体を編集中なら、入力欄をまとめて送るフォームのid（route.tsx の「表を編集」）。表示中はundefined
  bulkEditFormId?: string;
  // 長押ししたまま動かして並べ替えるときの処理（NotebookTable）
  drag?: LongPressDragHandlers;
  dragDisabled?: boolean;
  // この単語を並べ替えで動かしている最中
  isDragSource?: boolean;
}) {
  // 単語帳ページの action(intent で振り分け)に送信する
  const actionUrl = `/my-notebooks/${notebookId}`;

  // 見出し語の列と、それを除いた列。表示順そのまま
  const [headColumn, ...bodyColumns] = columns;

  // ★は押すたびに回数を+1して次の色へ進める（addStar）。サーバーの往復を待たずに次の色を見せるため、
  // 押した後の回数（starTarget）を保存が追いつくまで表示する（displayedStarCount）。
  // 素早く何回か押しても1回ずつ確実に保存されるよう、押すたびに別の fetcherKey で送る（同じ fetcher だと前の送信が取り消される）
  const submit = useSubmit();
  const [starTarget, setStarTarget] = useState<number | null>(null);
  // 保存が追いついたら（または回数を修正・リセットして保存済みの回数が変わったら）押した後の回数は使わない
  if (starTarget !== null && card.starCount >= starTarget) {
    setStarTarget(null);
  }
  const displayedCount = displayedStarCount(card.starCount, starTarget);
  const displayedStarred = card.starred || starTarget !== null;
  function handleAddStar() {
    const next = displayedCount + 1;
    setStarTarget(next);
    void submit(
      { intent: "addStar", cardId: card.id },
      {
        method: "post",
        action: actionUrl,
        navigate: false,
        fetcherKey: `addStar:${card.id}:${next}`,
      },
    );
  }
  const deleteFetcher = useFetcher();
  // 表全体の編集中に、この単語へ足した空の組の数（右端の＋）。保存で送り、編集を終えたら消す
  const [addedRows, setAddedRows] = useState(0);
  if (!bulkEditFormId && addedRows > 0) setAddedRows(0);

  // ★を付けた回数に応じた色。0回（未使用）ならundefinedになりニュートラル表示にする
  const { colors: starColors } = useStarColors();
  const starColor = starColorFor(displayedCount, starColors);

  // 見出し語1件につき、rows（組）の件数ぶん<tr>を並べる。★・見出し語・操作のセルは全組にまたがらせる
  const rowCount = card.data.rows.length;

  // 表の左端の★の列。押すたびに回数を+1し、次の色の★を即座に見せる（handleAddStar）。
  // ★を外すときは、隣の回数（StarCountEditor）から0にリセットする
  // rowSpan: この単語の組の数（表全体の編集中は、＋で足した組も含める）
  const starCell = (rowSpan: number) => (
    <td rowSpan={rowSpan} className="px-1.5 py-3 sm:px-4 align-top whitespace-nowrap">
      <span className="inline-flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="inline-flex items-center gap-0.5" title="★を付けた回数">
          <button
            type="button"
            onClick={handleAddStar}
            aria-label={displayedStarred ? "★の回数を増やす" : "★をつける"}
            style={starColor ? { color: starColor } : undefined}
            className={
              starColor
                ? "flex transition-opacity hover:opacity-75"
                : "flex text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
            }
          >
            <StarIcon filled={displayedStarred} className="h-4 w-4" />
          </button>
          <StarCountEditor
            cardId={card.id}
            notebookId={notebookId}
            starCount={displayedCount}
            color={starColor}
          />
        </span>
        {/* 目アイコンは暗記モード（/study, /review）でこのカードが表示された累計回数。
            ★のアイコン（StarIcon）と同じ大きさで中心をそろえる */}
        <span
          aria-label="暗記モードで表示した回数"
          title="暗記モードで見た回数"
          className="inline-flex items-center gap-0.5 text-xs leading-none text-zinc-400 dark:text-zinc-600"
        >
          <EyeIcon className="h-4 w-4" />
          {card.viewCount}
        </span>
      </span>
    </td>
  );

  if (bulkEditFormId) {
    // 表全体の編集中。見出し語と、各組・各列の値をすべて入力欄にする。入力欄は表の外にあるフォームに
    // form 属性で結び付け、単語のidを前に付けた名前（bulkCardFieldName）でまとめて送る。
    // 結合セル（同じ値が続く組）は、編集中は結合を解いて1組ずつの入力欄にする。
    // 右端の＋でこの単語に空の組を足せ、組のマスを全部空にして保存するとその組を消す（compactRows）
    const field = (name: string) => bulkCardFieldName(card.id, name);
    const editRows = [
      ...card.data.rows,
      ...Array.from({ length: addedRows }, (): Record<string, string> => ({})),
    ];
    const editRowCount = editRows.length;
    return (
      <>
        {editRows.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            data-card-index={index}
            className="border-t border-black/[.06] dark:border-white/[.1]"
          >
            {rowIndex === 0 && starCell(editRowCount)}
            {rowIndex === 0 && (
              <td rowSpan={editRowCount} className="px-1.5 py-2 sm:px-4 align-top">
                <input type="hidden" name="cardId" value={card.id} form={bulkEditFormId} />
                <input
                  form={bulkEditFormId}
                  name={field("head")}
                  data-grid-col={0}
                  aria-label={headColumn}
                  defaultValue={card.data.head}
                  maxLength={CARD_HEAD_MAX_LENGTH}
                  className={editInputClassName}
                />
              </td>
            )}
            {bodyColumns.map((column, columnIndex) => (
              <td key={column} className="px-1.5 py-2 sm:px-4 align-top">
                <input
                  form={bulkEditFormId}
                  name={field(`row:${rowIndex}:${column}`)}
                  data-grid-col={columnIndex + 1}
                  aria-label={column}
                  defaultValue={row[column] ?? ""}
                  // ＋で足した組は、最初の欄から入力を始められるようにする
                  autoFocus={rowIndex >= card.data.rows.length && columnIndex === 0}
                  maxLength={CARD_VALUE_MAX_LENGTH}
                  className={editInputClassName}
                />
              </td>
            ))}
            {rowIndex === 0 && (
              <td rowSpan={editRowCount} className="px-1.5 py-2 sm:px-4 text-right align-top">
                <button
                  type="button"
                  onClick={() => setAddedRows((count) => count + 1)}
                  aria-label={`「${card.data.head}」に組を追加`}
                  title="組（意味など）を追加"
                  className="px-1 text-lg leading-none text-zinc-400 transition-colors hover:text-coral-600 dark:text-zinc-500 dark:hover:text-coral-400"
                >
                  ＋
                </button>
              </td>
            )}
          </tr>
        ))}
      </>
    );
  }

  // 本文の各列は、列ごとに連続して同じ値が続く区間だけをrowSpanでまとめる（Excelの結合セルと同じ）
  const bodySpansByColumn = bodyColumns.map((column) =>
    computeRowSpans(card.data.rows.map((row) => row[column] ?? "")),
  );

  return (
    <>
      {card.data.rows.map((row, rowIndex) => (
        // どの組の行を長押ししても、この単語を並べ替えられる
        <DraggableTr
          key={rowIndex}
          data-card-index={index}
          drag={drag}
          dragDisabled={dragDisabled}
          className={`border-t border-black/[.06] dark:border-white/[.1] ${isDragSource ? "opacity-40" : ""}`}
        >
          {rowIndex === 0 && starCell(rowCount)}
          {rowIndex === 0 && (
            <td
              rowSpan={rowCount}
              className="px-1.5 py-3 sm:px-4 min-w-[4.5rem] align-top text-sm font-medium [overflow-wrap:anywhere] text-zinc-900 dark:text-zinc-100"
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
                className="px-1.5 py-3 sm:px-4 min-w-[4.5rem] align-top text-sm [overflow-wrap:anywhere] text-zinc-700 dark:text-zinc-300"
              >
                {row[column] ?? ""}
              </td>
            );
          })}
          {rowIndex === 0 && (
            <td
              rowSpan={rowCount}
              className="px-1.5 py-3 sm:px-4 text-right align-top whitespace-nowrap"
            >
              {/* 編集は表の上の「編集」からまとめて行う。ここには削除だけを置く。
                  確認ダイアログで「キャンセル」された場合はpreventDefaultで送信自体を止める */}
              <deleteFetcher.Form
                method="post"
                action={actionUrl}
                className="inline"
                onSubmit={(event) => {
                  if (!window.confirm("この単語を削除しますか？")) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="intent" value="deleteCard" />
                <input type="hidden" name="cardId" value={card.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 transition-colors hover:underline dark:text-red-400"
                >
                  削除
                </button>
              </deleteFetcher.Form>
            </td>
          )}
        </DraggableTr>
      ))}
    </>
  );
}
