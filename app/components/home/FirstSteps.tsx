import { useFetcher } from "react-router";

import Link from "@/components/Link";
import type { FormState } from "@/lib/shared/form-state";
import { LANGUAGES } from "@/lib/shared/learn/languages";

// まだ単語帳も学習教材も開いたことがない人に、ホーム（/history）の一番上で「最初の一歩」を示す3枚のカード。
// 単語帳の2枚は /my-notebooks の action（createBlankNotebook）で空の単語帳を作り、そのページへ移る
export default function FirstSteps() {
  return (
    <section aria-labelledby="first-steps-heading" className="flex w-full flex-col gap-4">
      <div className="text-center">
        <h2
          id="first-steps-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          ようこそ！ まずはここから始めましょう
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          学習すると、ここに前回の続きと学習記録が表示されます。
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <li>
          <Link
            href="/learn"
            className={`${CARD_CLASS} border-tealblue-200 hover:border-tealblue-400 hover:shadow-tealblue-100 dark:border-tealblue-700 dark:bg-tealblue-950/60 dark:hover:border-tealblue-400`}
          >
            <StepBody
              title="教材で学ぶ"
              description={`${LANGUAGES.map((l) => l.label).join("・")}の文法や単語を、説明と練習問題で学べます。`}
              action="言語を選ぶ"
              actionClassName="bg-button-learn group-hover:bg-button-learn-hover"
            />
          </Link>
        </li>
        <li>
          <CreateNotebookCard
            title="単語帳を作る"
            description="覚えたい単語を表に入力して、暗記学習やクイズで覚えられます。"
            action="新しい単語帳を作る"
          />
        </li>
        <li>
          <CreateNotebookCard
            title="Excelから取り込む"
            description="Excel・スプレッドシートにまとめた単語を、そのまま単語帳にできます。"
            action="取り込んで作る"
            then="import"
          />
        </li>
      </ul>
    </section>
  );
}

const CARD_CLASS =
  "group flex h-full w-full flex-col gap-3 rounded-2xl border bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 dark:hover:shadow-none";

// 押すと空の単語帳を作って開く。then="import" なら取り込み欄を開いた状態で始まる
function CreateNotebookCard({
  title,
  description,
  action,
  then,
}: {
  title: string;
  description: string;
  action: string;
  then?: "import";
}) {
  const fetcher = useFetcher<FormState>();
  const pending = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action="/my-notebooks" className="h-full">
      <input type="hidden" name="intent" value="createBlankNotebook" />
      {then && <input type="hidden" name="then" value={then} />}
      <button
        type="submit"
        disabled={pending}
        className={`${CARD_CLASS} border-coral-200 hover:border-coral-400 hover:shadow-coral-100 dark:border-coral-800 dark:bg-coral-950/60 dark:hover:border-coral-500`}
      >
        <StepBody
          title={title}
          description={description}
          action={pending ? "作成中…" : action}
          actionClassName="bg-button-notebook group-hover:bg-button-notebook-hover"
        />
      </button>
      {fetcher.data?.error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {fetcher.data.error}
        </p>
      )}
    </fetcher.Form>
  );
}

function StepBody({
  title,
  description,
  action,
  actionClassName,
}: {
  title: string;
  description: string;
  action: string;
  actionClassName: string;
}) {
  return (
    <>
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</span>
      <span className="flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {description}
      </span>
      <span
        className={`self-start rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors ${actionClassName}`}
      >
        {action} →
      </span>
    </>
  );
}
