import { useState } from "react";
import { useFetcher } from "react-router";

import { useLongPressDrag, type LongPressDragHandlers } from "@/hooks/useLongPressDrag";
import type { FormState } from "@/lib/shared/form-state";
import { COLUMN_NAME_MAX_LENGTH } from "@/lib/shared/notebook-schema";
import { headDividerClassName } from "./CardRow";

const noFormState: FormState = {};

// 単語帳の表の列の見出し。ダブルクリック（スマホでは長押しして離す）で名前を変えられ、名前の変更中は
// 見出し語以外の列を削除できる。長押ししたまま動かすと並べ替え（見出し語の列は先頭に固定なので動かさない）
export default function ColumnHeaderCell({
  notebookId,
  column,
  index,
  disabled,
  drag,
  isDragSource,
}: {
  notebookId: string;
  column: string;
  index: number;
  // 表全体の編集中など、名前の変更・並べ替えをさせないとき
  disabled: boolean;
  drag?: LongPressDragHandlers;
  isDragSource: boolean;
}) {
  const isHeadColumn = index === 0;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column);
  const renameFetcher = useFetcher<FormState>();
  const deleteFetcher = useFetcher<FormState>();
  const state = renameFetcher.data ?? noFormState;
  const pending = renameFetcher.state !== "idle";
  const actionUrl = `/my-notebooks/${notebookId}`;

  // 名前の変更に成功したら閉じる（列名が変わるとこの見出し自体が作り直されるが、同じ名前のまま保存したときのため）
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) setRenaming(false);
  }

  function startRename() {
    if (disabled) return;
    setName(column);
    setRenaming(true);
  }
  const ref = useLongPressDrag(
    { onLongPress: startRename, ...(isHeadColumn ? {} : drag) },
    disabled || renaming,
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // 日本語入力の変換を確定する Enter では送らない
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (name.trim() === column) setRenaming(false);
      else if (!pending) {
        void renameFetcher.submit(
          { intent: "renameColumn", columnIndex: String(index), name },
          { method: "post", action: actionUrl },
        );
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setRenaming(false);
    }
  }

  function handleDelete() {
    if (
      !window.confirm(`列「${column}」を削除しますか？この列に入力済みのデータはすべて失われます。`)
    ) {
      return;
    }
    void deleteFetcher.submit(
      { intent: "deleteColumn", columnIndex: String(index) },
      { method: "post", action: actionUrl },
    );
    setRenaming(false);
  }

  return (
    <th
      ref={ref}
      data-column-index={index}
      onDoubleClick={startRename}
      title={
        disabled
          ? undefined
          : "ダブルクリック（スマホでは長押し）で名前を変更、長押ししたまま動かすと並べ替え"
      }
      className={`min-w-[4.5rem] px-1.5 py-3 text-sm font-semibold text-zinc-700 select-none [-webkit-touch-callout:none] data-[long-pressed]:bg-coral-50 sm:px-4 dark:text-zinc-300 dark:data-[long-pressed]:bg-coral-950/30 ${
        isHeadColumn ? headDividerClassName : ""
      } ${isDragSource ? "opacity-40" : ""}`}
    >
      {renaming ? (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
              aria-label="列の名前"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!pending) setRenaming(false);
              }}
              maxLength={COLUMN_NAME_MAX_LENGTH}
              className="w-28 rounded border border-black/[.1] bg-white px-2 py-1 text-sm font-normal outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-950 dark:focus:border-white/[.4]"
            />
            {!isHeadColumn && (
              <button
                type="button"
                aria-label="列を削除"
                // 押したときに入力欄からフォーカスが外れて（onBlur で）閉じないようにする
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleDelete}
                className="text-xs font-normal whitespace-nowrap text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </button>
            )}
          </div>
          {state.error && (
            <span role="alert" className="text-xs font-normal text-red-600 dark:text-red-400">
              {state.error}
            </span>
          )}
        </div>
      ) : (
        column
      )}
    </th>
  );
}
