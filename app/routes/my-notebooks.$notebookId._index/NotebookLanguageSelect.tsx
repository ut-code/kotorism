import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";
import {
  NOTEBOOK_LANGUAGES,
  NOTEBOOK_LANGUAGE_LABELS,
  type NotebookLanguage,
} from "@/lib/shared/notebook-language";

// 単語帳の言語。選ぶと、単語を入力するときにその言語の入力補助（アクセント記号・ピンイン）が付く。
// 学習教材にない言語（英語など）は「指定なし」にする。変えられるのは作成者だけで、共同編集者には選んだ言語だけを見せる
export default function NotebookLanguageSelect({
  notebookId,
  language,
  canEdit,
}: {
  notebookId: string;
  language: NotebookLanguage | null;
  canEdit: boolean;
}) {
  const fetcher = useFetcher<FormState>();
  const pending = fetcher.state !== "idle";
  // 保存中は、選んだ言語を先に見せる
  const pendingLanguage = fetcher.formData?.get("language");
  const value = typeof pendingLanguage === "string" ? pendingLanguage : (language ?? "");

  if (!canEdit) {
    if (language === null) return null;
    return (
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        言語: {NOTEBOOK_LANGUAGE_LABELS[language]}
      </p>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
      <label htmlFor="notebook-language">言語</label>
      <select
        id="notebook-language"
        aria-label="入力補助の言語"
        value={value}
        disabled={pending}
        onChange={(event) =>
          void fetcher.submit(
            { intent: "updateLanguage", language: event.target.value },
            { method: "post", action: `/my-notebooks/${notebookId}` },
          )
        }
        className="rounded-md border border-black/[.1] bg-transparent px-1.5 py-0.5 text-xs text-zinc-700 outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-300"
      >
        <option value="">指定なし</option>
        {NOTEBOOK_LANGUAGES.map((option) => (
          <option key={option} value={option}>
            {NOTEBOOK_LANGUAGE_LABELS[option]}
          </option>
        ))}
      </select>
      {fetcher.data?.error && (
        <span role="alert" className="text-red-600 dark:text-red-400">
          {fetcher.data.error}
        </span>
      )}
    </div>
  );
}
