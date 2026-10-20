import { useState } from "react";
import { useFetcher, useSubmit } from "react-router";

import EyeIcon from "@/components/EyeIcon";
import type { LongPressDragHandlers } from "@/hooks/useLongPressDrag";
import StarIcon from "@/components/StarIcon";
import StarCountEditor from "@/components/StarCountEditor";
import { useStarColors } from "@/hooks/useStarColors";
import { bulkCardFieldName } from "@/lib/shared/bulk-edit";
import {
  expandMergedValues,
  initialMergedUp,
  mergeSpans,
  mergeWithNext,
  splitLast,
  type MergedUp,
} from "@/lib/shared/card-groups";
import { CARD_HEAD_MAX_LENGTH, CARD_VALUE_MAX_LENGTH } from "@/lib/shared/notebook-schema";
import { starColorFor } from "@/lib/shared/star-colors";
import { displayedStarCount } from "@/lib/shared/star-progress";
import type { CardData } from "@/lib/shared/card-data";
import DraggableTr from "./DraggableTr";

// 表全体の編集中の入力欄（編集中に足した新しい行の入力欄でも使う）
export const editInputClassName =
  "w-full min-w-16 rounded border border-black/[.1] bg-transparent px-2 py-1 text-sm outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]";

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
  // 表全体の編集中の、各組の入力中の値とマスの結合（右端の＋で足した空の組も含める）。
  // 編集を始めたときの値から、同じ値が続くマスを結合済みとして始め（表示中の結合と同じ見た目）、編集を終えたら消す
  const [editState, setEditState] = useState<{
    rows: CardData["rows"];
    mergedUp: MergedUp[];
  } | null>(null);
  if (!bulkEditFormId && editState !== null) setEditState(null);

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
    // 本文の各列は Excel の結合セルのように、列ごとに下の組のマスと結合（⬇ 結合）・分割（✂ 分割）できる。
    // 結合したマスは1つの入力欄に1回入力するだけで、結合した組すべてに同じ値を隠し入力で送る
    // （サーバー側は結合を知らずに、1組ずつ入力したときと同じ読み取り方をする）。
    // 右端の＋でこの単語に空の組を足せ、組のマスを全部空にして保存するとその組を消す（compactRows）
    const field = (name: string) => bulkCardFieldName(card.id, name);
    const current = editState ?? {
      rows: card.data.rows,
      mergedUp: initialMergedUp(card.data.rows, bodyColumns),
    };
    const editRows = expandMergedValues(current.rows, current.mergedUp, bodyColumns);
    const editRowCount = editRows.length;
    const editSpansByColumn = bodyColumns.map((column) => mergeSpans(current.mergedUp, column));
    const updateEdit = (update: (state: typeof current) => typeof current) =>
      setEditState((prev) => update(prev ?? current));
    const updateValue = (rowIndex: number, column: string, value: string) =>
      updateEdit((state) => ({
        ...state,
        rows: state.rows.map((row, i) => (i === rowIndex ? { ...row, [column]: value } : row)),
      }));
    // 先頭が start の結合に、すぐ下の組のマスを結合する。
    // 下のマスに別の値が入っていれば、上のマスの値にそろえて消えてしまうため確認する
    const mergeCell = (start: number, column: string) => {
      const below = editRows[start + editSpansByColumn[bodyColumns.indexOf(column)][start]];
      const existing = below?.[column] ?? "";
      if (
        existing !== "" &&
        existing !== (editRows[start][column] ?? "") &&
        !window.confirm(`結合すると「${existing}」は上のマスの値にそろえられます。よろしいですか？`)
      ) {
        return;
      }
      updateEdit((state) => ({ ...state, mergedUp: mergeWithNext(state.mergedUp, start, column) }));
    };
    // 先頭が start の結合から、いちばん下の組のマスを切り離す。切り離したマスは空欄から入力し直す
    // （同じ値のままだと、保存して表示に戻ったときにまた結合して見えるため）
    const splitCell = (start: number, column: string) => {
      const last = start + editSpansByColumn[bodyColumns.indexOf(column)][start] - 1;
      updateEdit((state) => ({
        rows: state.rows.map((row, i) => (i === last ? { ...row, [column]: "" } : row)),
        mergedUp: splitLast(state.mergedUp, start, column),
      }));
    };
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
            {bodyColumns.map((column, columnIndex) => {
              const span = editSpansByColumn[columnIndex][rowIndex];
              // 上の組のマスに結合されたマスは描画しない（値は結合の先頭のマスの隠し入力で送る）
              if (span === 0) return null;
              const hasBelow = rowIndex + span < editRowCount;
              return (
                <td key={column} rowSpan={span} className="px-1.5 py-2 sm:px-4 align-top">
                  <input
                    form={bulkEditFormId}
                    name={field(`row:${rowIndex}:${column}`)}
                    data-grid-col={columnIndex + 1}
                    aria-label={column}
                    value={row[column] ?? ""}
                    onChange={(event) => updateValue(rowIndex, column, event.target.value)}
                    // ＋で足した組は、最初の欄から入力を始められるようにする
                    autoFocus={rowIndex >= card.data.rows.length && columnIndex === 0}
                    maxLength={CARD_VALUE_MAX_LENGTH}
                    className={editInputClassName}
                  />
                  {/* 結合された組にも同じ値を送るための隠し入力 */}
                  {Array.from({ length: span - 1 }, (_, k) => rowIndex + 1 + k).map(
                    (mergedIndex) => (
                      <input
                        key={mergedIndex}
                        type="hidden"
                        form={bulkEditFormId}
                        name={field(`row:${mergedIndex}:${column}`)}
                        value={row[column] ?? ""}
                      />
                    ),
                  )}
                  {(span > 1 || hasBelow) && (
                    <span className="mt-1 flex gap-2 text-xs whitespace-nowrap">
                      {span > 1 && (
                        <button
                          type="button"
                          onClick={() => splitCell(rowIndex, column)}
                          aria-label={`「${column}」の結合を分割`}
                          title="いちばん下の組のマスを切り離す"
                          className="text-coral-600 transition-colors hover:underline dark:text-coral-400"
                        >
                          ✂ 分割
                        </button>
                      )}
                      {hasBelow && (
                        <button
                          type="button"
                          onClick={() => mergeCell(rowIndex, column)}
                          aria-label={`「${column}」を下の組と結合`}
                          title="下の組のマスと結合し、1回の入力で同じ値を保存する"
                          className="text-zinc-500 transition-colors hover:underline dark:text-zinc-400"
                        >
                          ⬇ 結合
                        </button>
                      )}
                    </span>
                  )}
                </td>
              );
            })}
            {rowIndex === 0 && (
              <td rowSpan={editRowCount} className="px-1.5 py-2 sm:px-4 text-right align-top">
                <button
                  type="button"
                  onClick={() =>
                    updateEdit((state) => ({
                      rows: [...state.rows, {}],
                      mergedUp: [...state.mergedUp, ...initialMergedUp([{}], bodyColumns)],
                    }))
                  }
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
  // 空のマス同士は結合しない（未入力のマスが1つの大きな空欄に見えて紛らわしいのを避けるため）。
  // 編集を始めたときの結合（initialMergedUp）と同じ基準にして、編集を開いても見た目が変わらないようにする
  const viewMergedUp = initialMergedUp(card.data.rows, bodyColumns);
  const bodySpansByColumn = bodyColumns.map((column) => mergeSpans(viewMergedUp, column));

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
