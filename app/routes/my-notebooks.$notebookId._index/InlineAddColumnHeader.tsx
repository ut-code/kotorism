import { useState } from "react";
import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";
import { COLUMN_NAME_MAX_LENGTH } from "@/lib/shared/notebook-schema";

const initialState: FormState = {};

// 【試作】単語帳の表の見出し行の右端に置く「＋」。押すと列名の入力欄になり、表の中で列を追加できる。
// Enter で追加、Esc で閉じる
export default function InlineAddColumnHeader({ notebookId }: { notebookId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;
  const pending = fetcher.state !== "idle";

  // 追加に成功したら入力欄を閉じる
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setOpen(false);
      setName("");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="表に列を追加"
        title="列を追加"
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-coral-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-coral-400"
      >
        ＋
      </button>
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (!pending) {
        void fetcher.submit(
          { intent: "addColumn", name },
          { method: "post", action: `/my-notebooks/${notebookId}` },
        );
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setName("");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        autoFocus
        aria-label="新しい列の名前"
        placeholder="列の名前（Enterで追加）"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // 何も入力せずに欄の外を押したら閉じる
          if (!name && !pending) setOpen(false);
        }}
        maxLength={COLUMN_NAME_MAX_LENGTH}
        className="w-40 rounded border border-black/[.1] bg-white px-2 py-1 text-sm font-normal outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-950 dark:focus:border-white/[.4]"
      />
      {state.error && (
        <span role="alert" className="text-xs font-normal text-red-600 dark:text-red-400">
          {state.error}
        </span>
      )}
    </div>
  );
}
