import { useRef, useState } from "react";
import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";
import { CARD_HEAD_MAX_LENGTH, CARD_VALUE_MAX_LENGTH } from "@/lib/shared/notebook-schema";
import { headDividerClassName } from "./CardRow";
import { caretAtEdge, focusInput } from "./caret";
import { useAssistField } from "./InputAssist";

const initialState: FormState = {};

const inputClassName =
  "w-full min-w-16 rounded border border-black/[.1] bg-transparent px-2 py-1 text-sm outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]";

// 矢印キーで同じ行の隣の入力欄へ移る（文字の途中ではカーソルを動かすだけ。caretAtEdge）
function moveBetweenInputs(event: React.KeyboardEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const forward = event.key === "ArrowRight";
  if (!caretAtEdge(input, forward)) return;
  const inputs = Array.from(input.closest("tr")?.querySelectorAll("input") ?? []);
  const next = inputs[inputs.indexOf(input) + (forward ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  focusInput(next, forward);
}

// 【試作】単語帳の表のいちばん下に置く「＋」の行。押すとその上に入力行が開き、表の中で単語（1組ぶん）を追加できる。
// 見出し語を空けて追加すると、いちばん下の単語の新しい組になる（多義語。サーバーの createCard）。
// Enter・↓・＋で追加して次の空の行へ進み（見出し語の欄から続けて入力できる）、Esc・「キャンセル」で閉じる。
// ← → で隣の欄へ移れる。入力中も＋は出したままにする
// 表の行（<tr>）の中には <form> を置けないため、入力値を state で持ち、Enter で fetcher.submit する
export default function InlineAddCardRow({
  notebookId,
  columns,
  open,
  onOpenChange,
}: {
  notebookId: string;
  columns: string[];
  // 入力行が開いているか。表（NotebookTable）が持ち、開いている間は「まだ単語がありません」を出さない
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const headRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<FormState>();
  const assistField = useAssistField();
  const state = fetcher.data ?? initialState;
  // 保存中（送信中）だけを待つ。保存が済んで表を読み直している間（loading）は入力欄がもう空なので、
  // 続けて Enter を押したら次の単語として送る（待つと、すぐ打った単語の Enter が捨てられる）
  const pending = fetcher.state === "submitting";

  // 追加に成功したら入力欄を空にして、見出し語の欄から続けて入力できるようにする
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) setValues({});
  }

  const [headColumn, ...bodyColumns] = columns;
  // 見出し語 + 列 + 操作の列
  const columnCount = columns.length + 1;

  // 入力中の単語があれば追加して次の空の行へ、何も入力していなければ見出し語の欄へ戻るだけ（↓・＋）
  const isBlank = Object.values(values).every((value) => value.trim() === "");
  function addAndNext() {
    if (isBlank) headRef.current?.focus();
    else submit();
  }

  const plusRow = (
    <tr className="border-t border-black/[.06] dark:border-white/[.1]">
      <td colSpan={columnCount} className="p-0">
        <button
          type="button"
          onClick={() => (open ? addAndNext() : onOpenChange(true))}
          aria-label="表に単語を追加"
          title="単語を追加"
          className="w-full py-2 text-lg leading-none text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-coral-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-coral-400"
        >
          ＋
        </button>
      </td>
    </tr>
  );

  if (!open) return plusRow;

  function submit() {
    if (pending) return;
    const data: Record<string, string> = { intent: "createCard", head: values.head ?? "" };
    for (const column of bodyColumns) data[`row:0:${column}`] = values[column] ?? "";
    void fetcher.submit(data, { method: "post", action: `/my-notebooks/${notebookId}` });
    headRef.current?.focus();
  }

  function close() {
    onOpenChange(false);
    setValues({});
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // 日本語入力の変換を確定する Enter では送らない
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      addAndNext();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      moveBetweenInputs(event);
    }
  }

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <tr className="border-t border-black/[.06] bg-coral-50/40 dark:border-white/[.1] dark:bg-coral-950/10">
        <td className={`px-1.5 py-2 sm:px-4 align-top ${headDividerClassName}`}>
          <input
            ref={headRef}
            autoFocus
            aria-label={headColumn}
            placeholder={headColumn}
            value={values.head ?? ""}
            onChange={(event) => setValue("head", event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={CARD_HEAD_MAX_LENGTH}
            className={inputClassName}
            {...assistField(0, headColumn)}
          />
        </td>
        {bodyColumns.map((column, columnIndex) => (
          <td key={column} className="px-1.5 py-2 sm:px-4 align-top">
            <input
              aria-label={column}
              placeholder={column}
              value={values[column] ?? ""}
              onChange={(event) => setValue(column, event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={CARD_VALUE_MAX_LENGTH}
              className={inputClassName}
              {...assistField(columnIndex + 1, column)}
            />
          </td>
        ))}
        <td className="px-1.5 py-2 sm:px-4 text-right align-top whitespace-nowrap">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="mr-3 rounded-full bg-coral-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-coral-600 disabled:opacity-50"
          >
            {pending ? "追加中…" : "追加"}
          </button>
          <button
            type="button"
            onClick={close}
            className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-400"
          >
            キャンセル
          </button>
        </td>
      </tr>
      <tr>
        <td
          colSpan={columnCount}
          className="px-1.5 pb-2 sm:px-4 text-xs text-zinc-500 dark:text-zinc-500"
        >
          {state.error ? (
            <span role="alert" className="text-red-600 dark:text-red-400">
              {state.error}
            </span>
          ) : (
            "Enter・↓ で追加して次の行へ、Escでキャンセルします。← → で隣の欄へ移れます。見出し語を空けると、上の単語の組として追加します。"
          )}
        </td>
      </tr>
      {plusRow}
    </>
  );
}
