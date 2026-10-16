import { useState } from "react";
import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";
import CardFieldsForm from "@/components/my-notebooks/CardFieldsForm";

const initialState: FormState = {};

function AddButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
    >
      {pending ? "追加中…" : "追加"}
    </button>
  );
}

export default function CreateCardForm({
  notebookId,
  columns,
}: {
  notebookId: string;
  columns: string[];
}) {
  // 単語帳ページの action（intent=createCard）に送信する。fetcher.data が直近の実行結果
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;
  // フォームの入力欄はCardFieldsForm内で非制御（defaultValue）で管理されているため、
  // 「値をJSでクリアする」ことができない。そこで<form key={formKey}>のkeyを変えることで
  // Reactにフォーム全体を作り直させ（アンマウント→再マウント）、入力欄を空に戻す
  const [formKey, setFormKey] = useState(0);
  // stateが変化した（=action実行結果が返ってきた）タイミングだけ、
  // 成功時（エラーが無い時）にkeyをインクリメントしてフォームをリセットする。
  // 初回マウント時はprevState === stateなので何もしない
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
    }
  }

  return (
    <>
      <fetcher.Form
        key={formKey}
        method="post"
        action={`/my-notebooks/${notebookId}`}
        className="flex flex-col gap-3 rounded-2xl border border-dashed border-black/[.15] p-4 dark:border-white/[.2]"
      >
        <input type="hidden" name="intent" value="createCard" />
        {/* 2件目以降（追加後にフォームが作り直されたとき）は見出し語へフォーカスを戻し、続けて入力できるようにする */}
        <CardFieldsForm columns={columns} autoFocusHead={formKey > 0} />
        <div className="flex flex-wrap items-center gap-3">
          <AddButton pending={fetcher.state !== "idle"} />
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            Tabキーで次の欄へ、Enterキーで追加できます。追加すると見出し語の欄に戻ります。
          </span>
        </div>
      </fetcher.Form>
      {state?.added && !state.error && (
        <p role="status" className="mt-2 text-sm text-green-700 dark:text-green-400">
          「{state.added}」を追加しました。
        </p>
      )}
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </>
  );
}
