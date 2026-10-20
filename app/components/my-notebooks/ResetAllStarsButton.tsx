import IntentForm from "@/components/IntentForm";

// 単語帳内の★（回数・付け外し状態）を一括でリセットするボタン。
// 単語帳まるごとに影響する操作なので、削除ボタンと同様に確認ダイアログを挟む
export default function ResetAllStarsButton({ notebookId }: { notebookId: string }) {
  return (
    <IntentForm
      action={`/my-notebooks/${notebookId}`}
      intent="resetAllStars"
      className="flex"
      onSubmit={(event) => {
        if (!window.confirm("この単語帳の★の回数をすべてリセットします。よろしいですか？")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-full rounded-full border border-coral-300 px-5 py-2 text-sm whitespace-nowrap text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
      >
        ★を一括リセット
      </button>
    </IntentForm>
  );
}
