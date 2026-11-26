import IntentForm from "@/components/IntentForm";

// 「⋯」メニューの項目の見た目（NotebookMoreMenu）
export const MENU_ITEM_CLASS =
  "block w-full px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";

const BUTTON_CLASS =
  "w-full rounded-full border border-coral-300 px-5 py-2 text-sm whitespace-nowrap text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none";

// 単語帳内の★（回数・付け外し状態）を一括でリセットするボタン。
// 単語帳まるごとに影響する操作なので、確認ダイアログを挟む。
// 単語帳のページでは「⋯」メニューの1項目として出す（variant="menuItem"）
export default function ResetAllStarsButton({
  notebookId,
  variant = "button",
}: {
  notebookId: string;
  variant?: "button" | "menuItem";
}) {
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
        role={variant === "menuItem" ? "menuitem" : undefined}
        className={variant === "menuItem" ? MENU_ITEM_CLASS : BUTTON_CLASS}
      >
        ★を一括リセット
      </button>
    </IntentForm>
  );
}
