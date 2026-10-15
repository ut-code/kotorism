import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";

const initialState: FormState = {};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral-500 px-5 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
    >
      {pending ? "作成中…" : "単語帳を作成"}
    </button>
  );
}

// Excelファイル無しで、タイトルだけを入力して単語帳を作成するフォーム。
// 作成直後は「見出し語」「意味」の2列・単語0件の状態になり、
// 単語帳ページ上の「列を編集」「単語を追加」でそのまま組み立てていける
export default function CreateBlankNotebookForm() {
  // /my-notebooks ページの action に送信する。作成に成功するとサーバー側で単語帳ページへ redirect される
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;

  return (
    <fetcher.Form
      method="post"
      action="/my-notebooks"
      className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <input type="hidden" name="intent" value="createBlankNotebook" />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="blankTitle"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          単語帳のタイトル
        </label>
        <input
          id="blankTitle"
          name="title"
          type="text"
          required
          placeholder="例: 今日覚えた単語"
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/[.3] dark:border-white/[.145] dark:focus:border-white/[.4]"
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        「見出し語」「意味」の2列・単語0件から始まります。列や単語は作成後のページで自由に追加・編集できます。
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton pending={fetcher.state !== "idle"} />
      </div>
    </fetcher.Form>
  );
}
