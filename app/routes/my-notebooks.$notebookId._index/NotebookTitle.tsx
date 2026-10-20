import { useEffect, useRef, useState } from "react";
import { useFetcher, useSearchParams } from "react-router";

import { NOTEBOOK_TITLE_MAX_LENGTH, type DuplicateChoice } from "@/lib/shared/notebook-schema";
import type { RenameNotebookState } from "@/lib/shared/notebook-title";

const noState: RenameNotebookState = {};
const headingClassName = "text-2xl font-semibold tracking-tight text-black dark:text-zinc-50";

// 単語帳のタイトル。作成者はタイトルを押すと書き換えられる（Enter・欄の外を押すと保存、Esc で取り消し）。
// 一覧の「新しい単語帳」から開いたとき（?new=1）は、仮のタイトルを選んだ入力欄から始め、そのまま名前を付けられる。
// 自分の別の単語帳と名前が重なるときは、このまま・番号を付ける・今日の日付を付ける、から選んでもらう
export default function NotebookTitle({
  notebookId,
  title,
  canEdit,
}: {
  notebookId: string;
  title: string;
  canEdit: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  // 作ったばかりの単語帳か。仮のタイトルのまま決めても、名前が重なっていないかを確かめる
  const [isNew] = useState(() => searchParams.get("new") === "1");
  const [editing, setEditing] = useState(() => canEdit && isNew);
  const [value, setValue] = useState(title);
  const fetcher = useFetcher<RenameNotebookState>();
  const state = fetcher.data ?? noState;
  // 名前が重なったときの選択肢を出しているか（入力し直したら、また保存し直す）
  const duplicate =
    state.duplicate && state.duplicate.title === value.trim() ? state.duplicate : null;
  const pending = fetcher.state !== "idle";
  // Esc で取り消したあとの blur では保存しない
  const cancelled = useRef(false);

  // 作成直後の印（?new=1）は一度使ったら外し、再読み込みで入力欄から始まらないようにする
  useEffect(() => {
    if (searchParams.get("new") === null) return;
    setSearchParams(
      (params) => {
        params.delete("new");
        return params;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [searchParams, setSearchParams]);

  // 保存に成功したら表示に戻る
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error && !state.duplicate) setEditing(false);
  }

  if (!canEdit) return <h1 className={headingClassName}>{title}</h1>;

  if (!editing) {
    return (
      <h1 className={headingClassName}>
        <button
          type="button"
          onClick={() => {
            setValue(title);
            setEditing(true);
          }}
          title="タイトルを変更"
          className="cursor-text rounded text-left decoration-zinc-300 decoration-dotted underline-offset-4 hover:underline dark:decoration-zinc-600"
        >
          {title}
        </button>
      </h1>
    );
  }

  function save(onDuplicate?: DuplicateChoice) {
    if (pending) return;
    if (value.trim() === title && !isNew && !onDuplicate) {
      setEditing(false);
      return;
    }
    void fetcher.submit(
      { intent: "renameNotebook", title: value, ...(onDuplicate ? { onDuplicate } : {}) },
      { method: "post", action: `/my-notebooks/${notebookId}` },
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        aria-label="単語帳のタイトル"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // 日本語入力の変換を確定する Enter では送らない
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancelled.current = true;
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (cancelled.current) {
            cancelled.current = false;
            return;
          }
          // 名前が重なったときの選択肢を出している間は、選んでもらうまで保存しない
          if (!duplicate) save();
        }}
        maxLength={NOTEBOOK_TITLE_MAX_LENGTH}
        className={`${headingClassName} w-full max-w-md rounded-lg border border-black/[.1] bg-transparent px-2 py-1 outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]`}
      />
      {duplicate && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-zinc-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-zinc-200"
        >
          <p>「{duplicate.title}」という名前の単語帳がすでにあります。どうしますか？</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["keep", "このままにする"],
                ["number", `「${duplicate.numbered}」にする`],
                ["date", `「${duplicate.dated}」にする`],
              ] as const
            ).map(([choice, label]) => (
              <button
                key={choice}
                type="button"
                disabled={pending}
                // 押したときに入力欄からフォーカスが外れて（onBlur で）閉じないようにする
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => save(choice)}
                className="rounded-full border border-coral-300 bg-white px-3 py-1 text-xs font-medium text-coral-700 transition-colors hover:bg-coral-50 disabled:opacity-50 dark:border-coral-900/50 dark:bg-transparent dark:text-coral-300 dark:hover:bg-coral-950/20"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}
