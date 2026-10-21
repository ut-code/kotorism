import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import type { LongPressDragHandlers, Point } from "@/hooks/useLongPressDrag";
import type { CardData } from "@/lib/shared/card-data";
import { bulkCardFieldName } from "@/lib/shared/bulk-edit";
import { CARD_HEAD_MAX_LENGTH, CARD_VALUE_MAX_LENGTH } from "@/lib/shared/notebook-schema";
import { insertionIndex, moveToInsertionPoint } from "@/lib/shared/reorder";
import { caretAtEdge, focusInput } from "./caret";
import CardRow, { editInputClassName, headDividerClassName } from "./CardRow";
import ColumnHeaderCell from "./ColumnHeaderCell";
import InlineAddCardRow from "./InlineAddCardRow";
import InlineAddColumnHeader from "./InlineAddColumnHeader";
import { useAssistField } from "./InputAssist";

type Card = { id: string; data: CardData; starred: boolean; starCount: number; viewCount: number };

// 並べ替えの最中の状態。from 番目を insertAt 番目の間へ動かそうとしている（lib/shared/reorder.ts）
type Drag = { kind: "card" | "column"; from: number; insertAt: number };
// 入れる場所を示す線（表の枠を基準にした位置）
type DropLine = { orientation: "horizontal" | "vertical"; offset: number };

// 単語帳の表。行（単語）や列を長押ししたまま動かして並べ替えられる。並べ替えはサーバーの応答を待たずに
// 並びを変えて見せ（送信中の fetcher.formData から並びを作る）、応答のあとは再取得した並びをそのまま使う
export default function NotebookTable({
  notebookId,
  columns,
  cards,
  bulkEditFormId,
}: {
  notebookId: string;
  columns: string[];
  cards: Card[];
  // 表全体を編集中なら、入力欄をまとめて送るフォームのid。編集中は並べ替え・列名の変更をさせない
  bulkEditFormId?: string;
}) {
  const editing = bulkEditFormId !== undefined;
  const frameRef = useRef<HTMLDivElement>(null);
  const moveFetcher = useFetcher();
  const moving = moveFetcher.state !== "idle";
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dropLine, setDropLine] = useState<DropLine | null>(null);

  // 表全体の編集中に、表の＋やいちばん下の行での ↓ で足した新しい行（画面で仮に付けた番号）。
  // 「保存」でほかの変更とまとめて送り、新しい単語として加える。編集を終えたら消す
  const [newRows, setNewRows] = useState<string[]>([]);
  // 表の下の＋で単語を入力している最中か（単語が無いときの案内を、入力中は出さない）
  const [adding, setAdding] = useState(false);
  const nextNewRowId = useRef(0);
  // 新しい行を足したあとに、その行のどの列の欄へフォーカスするか（行が描かれたあとの effect で使う）
  const focusColumnRef = useRef<number | null>(null);
  if (!editing && newRows.length > 0) setNewRows([]);
  function addNewRow(column: number) {
    nextNewRowId.current += 1;
    focusColumnRef.current = column;
    setNewRows((rows) => [...rows, `new-${nextNewRowId.current}`]);
  }
  useEffect(() => {
    const column = focusColumnRef.current;
    if (column === null) return;
    focusColumnRef.current = null;
    const inputs = frameRef.current?.querySelectorAll<HTMLInputElement>(
      `input[data-grid-col="${column}"]`,
    );
    inputs?.[inputs.length - 1]?.focus();
  }, [newRows]);

  // 編集中の入力欄を矢印キーで移る。↑↓ は同じ列の上下の欄へ（いちばん下で ↓ なら新しい行を足す）、
  // ← → は文字の端にカーソルがあるときだけ同じ行の隣の欄へ移る
  function handleGridKeyDown(event: React.KeyboardEvent<HTMLTableSectionElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.dataset.gridCol === undefined) return;
    if (event.nativeEvent.isComposing) return;
    const column = Number(input.dataset.gridCol);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const down = event.key === "ArrowDown";
      const sameColumn = Array.from(
        frameRef.current?.querySelectorAll<HTMLInputElement>(`input[data-grid-col="${column}"]`) ??
          [],
      );
      const next = sameColumn[sameColumn.indexOf(input) + (down ? 1 : -1)];
      event.preventDefault();
      if (next) next.focus();
      else if (down) addNewRow(column);
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const forward = event.key === "ArrowRight";
      if (!caretAtEdge(input, forward)) return;
      const inRow = Array.from(input.closest("tr")?.querySelectorAll("input[data-grid-col]") ?? []);
      const next = inRow[inRow.indexOf(input) + (forward ? 1 : -1)];
      if (!(next instanceof HTMLInputElement)) return;
      event.preventDefault();
      focusInput(next, forward);
    }
  }

  // 送信中の並べ替えを、表示する並びに先に反映する
  let displayedCards = cards;
  let displayedColumns = columns;
  const pending = moveFetcher.formData;
  if (pending) {
    const from = Number(pending.get("from"));
    const insertAt = Number(pending.get("insertAt"));
    if (pending.get("intent") === "moveCard" && cards[from]?.id === pending.get("cardId")) {
      displayedCards = moveToInsertionPoint(cards, from, insertAt);
    } else if (pending.get("intent") === "moveColumn") {
      displayedColumns = moveToInsertionPoint(columns, from, insertAt);
    }
  }

  // 単語ごとの、表の中での上端・下端（組が複数あると <tr> も複数になるので、同じ単語の行をまとめる）
  function cardBounds() {
    const bounds: { top: number; bottom: number }[] = [];
    frameRef.current?.querySelectorAll<HTMLElement>("tbody tr[data-card-index]").forEach((row) => {
      const index = Number(row.dataset.cardIndex);
      const rect = row.getBoundingClientRect();
      const current = bounds[index];
      bounds[index] = current
        ? { top: Math.min(current.top, rect.top), bottom: Math.max(current.bottom, rect.bottom) }
        : { top: rect.top, bottom: rect.bottom };
    });
    return bounds;
  }
  // 見出し語の列（0番）を除いた列の、左端・右端
  function columnBounds() {
    return Array.from(
      frameRef.current?.querySelectorAll<HTMLElement>("thead th[data-column-index]") ?? [],
    )
      .filter((th) => Number(th.dataset.columnIndex) >= 1)
      .map((th) => th.getBoundingClientRect());
  }

  function insertAtFor(kind: Drag["kind"], point: Point) {
    if (kind === "card") {
      return insertionIndex(
        cardBounds().map(({ top, bottom }) => (top + bottom) / 2),
        point.y,
      );
    }
    // 列は見出し語の列より後ろだけで並べ替える（入れる位置は1番以降）
    return (
      1 +
      insertionIndex(
        columnBounds().map((rect) => rect.left + rect.width / 2),
        point.x,
      )
    );
  }

  // 並びが変わらない位置（自分の前後）なら、入れる場所を示さない・送らない
  const changesOrder = ({ from, insertAt }: Drag) => insertAt !== from && insertAt !== from + 1;

  // 入れる場所を示す線の位置（表の枠を基準にする）。並びが変わらない位置なら出さない
  function dropLineFor(next: Drag): DropLine | null {
    const frame = frameRef.current;
    if (!frame || !changesOrder(next)) return null;
    const origin = frame.getBoundingClientRect();
    if (next.kind === "card") {
      const bounds = cardBounds();
      const y = next.insertAt < bounds.length ? bounds[next.insertAt].top : bounds.at(-1)!.bottom;
      return { orientation: "horizontal", offset: y - origin.top + frame.scrollTop };
    }
    const bounds = columnBounds();
    const target = next.insertAt - 1;
    const x = target < bounds.length ? bounds[target].left : bounds.at(-1)!.right;
    return { orientation: "vertical", offset: x - origin.left + frame.scrollLeft };
  }

  function dragHandlers(kind: Drag["kind"], from: number): LongPressDragHandlers {
    return {
      onDragStart: () => {
        setDrag({ kind, from, insertAt: from });
        setDropLine(null);
      },
      onDragMove: (point) => {
        const next = { kind, from, insertAt: insertAtFor(kind, point) };
        setDrag(next);
        setDropLine(dropLineFor(next));
      },
      onDragEnd: (point) => {
        const next = { kind, from, insertAt: insertAtFor(kind, point) };
        setDrag(null);
        setDropLine(null);
        if (!changesOrder(next)) return;
        void moveFetcher.submit(
          {
            intent: kind === "card" ? "moveCard" : "moveColumn",
            from: String(from),
            insertAt: String(next.insertAt),
            ...(kind === "card" ? { cardId: cards[from].id } : {}),
          },
          { method: "post", action: `/my-notebooks/${notebookId}` },
        );
      },
    };
  }

  const dragEnabled = !editing && !moving;

  return (
    <div
      ref={frameRef}
      className="relative mt-3 overflow-x-auto rounded-2xl border border-black/[.08] dark:border-white/[.145]"
    >
      {/* 列の幅は中身（列の中でいちばん長い文字）に合わせ、画面に入りきらない長い文字は折り返す。
          スマホなど幅の狭い画面でも、横にスクロールせずに表の全体が見えるようにする */}
      <table className="w-full border-collapse text-left">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {/* 列見出しは columns の並び順そのまま表示する。★（付け外し・回数・暗記モードで見た回数）は見出し語の下に置く */}
            {displayedColumns.map((column, index) => (
              <ColumnHeaderCell
                key={column}
                notebookId={notebookId}
                column={column}
                index={index}
                disabled={!dragEnabled}
                drag={dragHandlers("column", index)}
                isDragSource={drag?.kind === "column" && drag.from === index}
              />
            ))}
            {/* 右端は操作の列。見出し行には【試作】列を追加する＋を置く */}
            <th className="px-1.5 py-3 text-right sm:px-4" aria-label="操作">
              <div className="flex justify-end">
                <InlineAddColumnHeader notebookId={notebookId} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody onKeyDown={editing ? handleGridKeyDown : undefined}>
          {/* 単語が無いときの案内。＋で最初の単語を入力している間や、編集中は出さない */}
          {displayedCards.length === 0 && !adding && !editing ? (
            <tr>
              <td
                colSpan={displayedColumns.length + 1}
                className="px-1.5 py-6 text-center text-sm text-zinc-500 sm:px-4 dark:text-zinc-500"
              >
                まだ単語がありません。表の下の＋から追加してください。
              </td>
            </tr>
          ) : (
            // 単語1件ずつをCardRowに委譲する。表全体の編集中は各CardRowが入力欄を出し、
            // ページの「保存」でまとめて送る。表示は action 実行後の loader 再取得で更新される
            displayedCards.map((card, index) => (
              <CardRow
                key={card.id}
                index={index}
                notebookId={notebookId}
                columns={displayedColumns}
                card={card}
                bulkEditFormId={bulkEditFormId}
                drag={dragHandlers("card", index)}
                dragDisabled={!dragEnabled}
                isDragSource={drag?.kind === "card" && drag.from === index}
              />
            ))
          )}
          {editing && bulkEditFormId ? (
            <>
              {newRows.map((id) => (
                <NewBulkRow
                  key={id}
                  id={id}
                  columns={displayedColumns}
                  bulkEditFormId={bulkEditFormId}
                />
              ))}
              {/* 編集中の＋。押すと空の行を足し、「保存」でほかの変更とまとめて保存する */}
              <tr className="border-t border-black/[.06] dark:border-white/[.1]">
                <td colSpan={displayedColumns.length + 1} className="p-0">
                  <button
                    type="button"
                    onClick={() => addNewRow(0)}
                    aria-label="表に行を追加"
                    title="行を追加（いちばん下の行で ↓ を押しても追加できます）"
                    className="w-full py-2 text-lg leading-none text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-coral-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-coral-400"
                  >
                    ＋
                  </button>
                </td>
              </tr>
            </>
          ) : (
            // 【試作】表の中で単語を追加する＋の行
            <InlineAddCardRow
              notebookId={notebookId}
              columns={displayedColumns}
              open={adding}
              onOpenChange={setAdding}
            />
          )}
        </tbody>
      </table>
      {dropLine && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bg-coral-500 ${
            dropLine.orientation === "horizontal" ? "inset-x-0 h-0.5" : "inset-y-0 w-0.5"
          }`}
          style={
            dropLine.orientation === "horizontal"
              ? { top: dropLine.offset - 1 }
              : { left: dropLine.offset - 1 }
          }
        />
      )}
    </div>
  );
}

// 表全体の編集中に足した新しい行。入力欄は単語の行と同じく、表の外のフォームへ form 属性で結び付ける
function NewBulkRow({
  id,
  columns,
  bulkEditFormId,
}: {
  id: string;
  columns: string[];
  bulkEditFormId: string;
}) {
  const [headColumn, ...bodyColumns] = columns;
  const field = (name: string) => bulkCardFieldName(id, name);
  const assistField = useAssistField();
  return (
    <tr className="border-t border-black/[.06] bg-coral-50/40 dark:border-white/[.1] dark:bg-coral-950/10">
      <td className={`px-1.5 py-2 align-top sm:px-4 ${headDividerClassName}`}>
        <input type="hidden" name="newCardId" value={id} form={bulkEditFormId} />
        <input
          form={bulkEditFormId}
          name={field("head")}
          data-grid-col={0}
          aria-label={headColumn}
          placeholder={headColumn}
          maxLength={CARD_HEAD_MAX_LENGTH}
          className={editInputClassName}
          {...assistField(0, headColumn)}
        />
      </td>
      {bodyColumns.map((column, columnIndex) => (
        <td key={column} className="px-1.5 py-2 align-top sm:px-4">
          <input
            form={bulkEditFormId}
            name={field(`row:0:${column}`)}
            data-grid-col={columnIndex + 1}
            aria-label={column}
            placeholder={column}
            maxLength={CARD_VALUE_MAX_LENGTH}
            className={editInputClassName}
            {...assistField(columnIndex + 1, column)}
          />
        </td>
      ))}
      <td />
    </tr>
  );
}
