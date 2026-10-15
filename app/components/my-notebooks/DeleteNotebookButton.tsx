import IntentForm from "@/components/IntentForm";

// 単語帳ごと削除するボタン。取り消せない操作なので確認ダイアログを挟む
export default function DeleteNotebookButton({ notebookId }: { notebookId: string }) {
  return (
    <IntentForm
      action={`/my-notebooks/${notebookId}`}
      intent="deleteNotebook"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "この単語帳を削除します。中の単語も含めて元に戻せません。よろしいですか？",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 transition-colors hover:underline dark:text-red-400"
      >
        削除
      </button>
    </IntentForm>
  );
}
