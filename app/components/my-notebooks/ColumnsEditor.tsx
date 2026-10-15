import { useState } from "react";
import { useFetcher } from "react-router";

import IntentForm from "@/components/IntentForm";
import type { FormState } from "@/lib/shared/form-state";
import { COLUMN_NAME_MAX_LENGTH } from "@/lib/shared/notebook-schema";

const initialState: FormState = {};

const inputClassName =
  "rounded border border-black/[.1] bg-transparent px-2 py-1 text-sm outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]";

function SubmitButton({
  label,
  pendingLabel,
  pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral-500 px-3 py-1 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

// 列1つぶんの行。列名の変更フォームと（見出し語列以外は）削除ボタンを持つ
function ColumnRow({
  notebookId,
  index,
  name,
  isHeadColumn,
}: {
  notebookId: string;
  index: number;
  name: string;
  isHeadColumn: boolean;
}) {
  const actionUrl = `/my-notebooks/${notebookId}`;
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-black/[.06] p-2 dark:border-white/[.1]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-14 shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
          {isHeadColumn ? "見出し語" : `列${index + 1}`}
        </span>
        <fetcher.Form method="post" action={actionUrl} className="flex items-center gap-2">
          <input type="hidden" name="intent" value="renameColumn" />
          <input type="hidden" name="columnIndex" value={index} />
          <input
            name="name"
            defaultValue={name}
            maxLength={COLUMN_NAME_MAX_LENGTH}
            className={inputClassName}
          />
          <SubmitButton label="変更" pendingLabel="変更中…" pending={fetcher.state !== "idle"} />
        </fetcher.Form>
        {!isHeadColumn && (
          <IntentForm
            action={actionUrl}
            intent="deleteColumn"
            fields={{ columnIndex: String(index) }}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `列「${name}」を削除しますか？この列に入力済みのデータはすべて失われます。`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-600 transition-colors hover:underline dark:text-red-400"
            >
              この列を削除
            </button>
          </IntentForm>
        )}
      </div>
      {state?.error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </li>
  );
}

// 新しい列（意味・発音など）を末尾に追加するフォーム。
// 見出し語につき何件の値を持てるかは列単位で決めず、追加後にCardFieldsFormの
// 「＋ 値を追加」でセルごとに自由に増やせる
function AddColumnForm({ notebookId }: { notebookId: string }) {
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;
  // 追加成功のたびにkeyを変えてフォームを作り直し、入力欄を空に戻す（CreateCardFormと同じ手法）
  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
    }
  }

  return (
    <div>
      <fetcher.Form
        key={formKey}
        method="post"
        action={`/my-notebooks/${notebookId}`}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="intent" value="addColumn" />
        <input
          name="name"
          maxLength={COLUMN_NAME_MAX_LENGTH}
          placeholder="新しい列名（例: 例文 / 発音）"
          className={inputClassName}
        />
        <SubmitButton label="列を追加" pendingLabel="追加中…" pending={fetcher.state !== "idle"} />
      </fetcher.Form>
      {state?.error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}

// 単語帳の列（見出し語1列＋任意個の列）の追加・変更・削除を行うパネル。
// 普段は折りたたんでおき、必要なときだけ「列を編集」で開く
export default function ColumnsEditor({
  notebookId,
  columns,
}: {
  notebookId: string;
  columns: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-zinc-600 transition-colors hover:underline dark:text-zinc-400"
      >
        列を編集
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-dashed border-black/[.15] p-4 dark:border-white/[.2]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">列を編集</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          閉じる
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {columns.map((name, index) => (
          <ColumnRow
            key={name}
            notebookId={notebookId}
            index={index}
            name={name}
            isHeadColumn={index === 0}
          />
        ))}
      </ul>
      <div className="border-t border-black/[.06] pt-3 dark:border-white/[.1]">
        <AddColumnForm notebookId={notebookId} />
      </div>
    </div>
  );
}
