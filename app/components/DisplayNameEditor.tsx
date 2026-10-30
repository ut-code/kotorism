import { useState } from "react";
import { useFetcher } from "react-router";

import type { ParseResult } from "@/lib/shared/validation";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/shared/display-name-schema";

// ヘッダーの自分の名前。GitHub の PR のタイトルのように、鉛筆を押すとその場で入力欄に切り替わる。
// 別の設定ページを作らずに済み、変えた名前がそのまま目の前に反映される
export default function DisplayNameEditor({ name }: { name: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const fetcher = useFetcher<ParseResult<string>>();
  const pending = fetcher.state !== "idle";
  const error = fetcher.data && !fetcher.data.success ? fetcher.data.error : null;

  // 保存できたら表示に戻る。新しい名前は、action のあとに再実行されるルートの loader から props で届く。
  // 結果が届いた回だけ切り替えるため、前回の結果と比べてレンダー中に更新する(effect だと描画が二度走る)
  const [lastData, setLastData] = useState(fetcher.data);
  if (fetcher.data !== lastData) {
    setLastData(fetcher.data);
    if (fetcher.data?.success) setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-base font-semibold text-zinc-700 dark:text-zinc-200">{name}</span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label="名前を編集"
          title="名前を編集"
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
          </svg>
        </button>
      </span>
    );
  }

  return (
    <fetcher.Form
      method="post"
      action="/api/profile"
      className="flex flex-wrap items-center gap-2"
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsEditing(false);
      }}
    >
      <input
        name="name"
        aria-label="名前"
        defaultValue={name}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        className="w-40 rounded-md border border-black/[.15] bg-transparent px-2 py-1 text-base outline-none focus:border-coral-500 dark:border-white/[.2]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="rounded-md px-2 py-1 text-sm font-medium text-coral-600 hover:underline dark:text-coral-400"
      >
        Cancel
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </fetcher.Form>
  );
}
