import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";

const initialState: FormState = {};

// 一覧の「新しい単語帳」。押すとすぐ空の単語帳（「見出し語」「意味」の2列・単語0件、タイトルは「無題の単語帳」）を作って開く。
// タイトル・列・単語の入力や Excel の取り込みは、開いた単語帳のページでそのまま行う
export default function NewNotebookButton() {
  // /my-notebooks ページの action に送信する。作成に成功するとサーバー側で単語帳ページへ redirect される
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;
  const pending = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action="/my-notebooks" className="flex flex-col items-center gap-2">
      <input type="hidden" name="intent" value="createBlankNotebook" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
      >
        {pending ? "作成中…" : "＋ 新しい単語帳"}
      </button>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </fetcher.Form>
  );
}
