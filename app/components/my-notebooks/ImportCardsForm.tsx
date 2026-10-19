import { useState } from "react";
import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";

const initialState: FormState = {};

const languageOptions = ["フランス語", "ドイツ語", "スペイン語", "中国語", "英語"];

// フォーム送信中はボタンを disabled にし、ラベルを差し替える
function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
    >
      {pending ? "取り込み中…" : "Excelから追加"}
    </button>
  );
}

// 単語帳作成の参考になるテンプレートExcelをダウンロードするパネル。
// 「Excel・スプレッドシートから追加」パネルの中に置かれ、普段は折りたたんでおく。
// ここでダウンロードしたファイルへ記入した後は、同じパネルの取り込みフォームでそのまま追加できる
function ImportTemplate() {
  const [expanded, setExpanded] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>("英語");

  const downloadTemplate = async () => {
    const lang = selectedLanguage ?? "英語";
    const url = `/my-notebooks/template?filename=${encodeURIComponent(templateName || "単語帳テンプレート")}&language=${encodeURIComponent(lang)}`;
    window.location.href = url;
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
      >
        書き方の参考にテンプレートをダウンロード
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/[.06] p-3 dark:border-white/[.1]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          テンプレートをダウンロード
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          閉じる
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="templateName"
          className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          ファイル名(英数字のみ)
        </label>
        <input
          id="templateName"
          name="templateName"
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="例: French_1"
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/[.3] dark:border-white/[.145] dark:focus:border-white/[.4]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">言語を選択</p>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => {
            const isSelected = selectedLanguage === language;
            return (
              <button
                key={language}
                type="button"
                onClick={() => setSelectedLanguage(language)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "border-tealblue-600 bg-tealblue-600 text-white"
                    : "border-black/[.08] bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {language}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={downloadTemplate}
        className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        テンプレートをダウンロード
      </button>
    </div>
  );
}

// 単語帳ページ内で、Excelファイルから単語をまとめて追加するフォーム。
// 普段は折りたたんでおき、必要なときだけ「Excel・スプレッドシートから追加」で開く。
// 列名が既存の単語帳の列と一致すればそこに値が追加され、一致しない列名は
// 単語帳の末尾に新しい列として自動で追加される
export default function ImportCardsForm({ notebookId }: { notebookId: string }) {
  const fetcher = useFetcher<FormState>();
  const state = fetcher.data ?? initialState;
  const [expanded, setExpanded] = useState(false);
  // 取り込み成功のたびにkeyを変えてフォームを作り直し、ファイル選択欄を空に戻す
  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setFormKey((key) => key + 1);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-zinc-600 transition-colors hover:underline dark:text-zinc-400"
      >
        Excel・スプレッドシートから追加
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-dashed border-black/[.15] p-4 dark:border-white/[.2]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Excel・スプレッドシートから追加
        </h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
        >
          閉じる
        </button>
      </div>
      <ImportTemplate />
      <fetcher.Form
        key={formKey}
        method="post"
        action={`/my-notebooks/${notebookId}`}
        encType="multipart/form-data"
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="intent" value="importCards" />
        <input
          name="file"
          type="file"
          accept=".xlsx"
          required
          className="text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-coral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-coral-700 hover:file:bg-coral-200 hover:file:text-coral-800 dark:text-zinc-400 dark:file:bg-coral-900/30 dark:file:text-coral-300 dark:hover:file:bg-coral-900/50 dark:hover:file:text-coral-200"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          1行目を見出し行として読み取ります。既存の列と同じ名前の列はそこに追加され、無い列名は新しい列として追加されます。
        </p>
        {/* Googleスプレッドシートは直接読み込まず、.xlsx で書き出したファイルを取り込んでもらう */}
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Googleスプレッドシートの場合は、「ファイル」→「ダウンロード」→「Microsoft
          Excel（.xlsx）」で保存したファイルを選んでください。
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
    </div>
  );
}
