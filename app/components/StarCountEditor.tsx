import { useState } from "react";

import IntentForm from "@/components/IntentForm";

// ★の回数（card.starCount）の横に置く、数字をクリックすると開く修正用ポップオーバー。
// 誤って★をクリックしてしまった場合に、回数を直接書き換えたり0にリセットしたりできる
export default function StarCountEditor({
  cardId,
  notebookId,
  starCount,
  color,
}: {
  cardId: string;
  notebookId: string;
  starCount: number;
  color?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="★の回数を修正する"
        aria-expanded={open}
        style={color ? { color } : undefined}
        className="text-xs text-zinc-400 underline decoration-dotted underline-offset-2 dark:text-zinc-600"
      >
        {starCount}
      </button>

      {open && (
        <>
          {/* パネル外側をクリックしたら閉じる */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-1/2 z-50 mt-1 w-44 -translate-x-1/2 rounded-lg border border-black/[.08] bg-white p-3 text-left shadow-lg dark:border-white/[.145] dark:bg-zinc-900">
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">★の回数を修正</p>
            {/* onSubmitはpreventDefaultせず、送信と同時にポップオーバーだけ閉じる */}
            <IntentForm
              action={`/my-notebooks/${notebookId}`}
              intent="setStarCount"
              fields={{ cardId }}
              onSubmit={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                name="count"
                min={0}
                defaultValue={starCount}
                className="w-14 rounded border border-black/[.08] bg-transparent px-1.5 py-1 text-sm dark:border-white/[.145]"
              />
              <button
                type="submit"
                className="rounded-full bg-coral-500 px-2.5 py-1 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 dark:hover:shadow-none"
              >
                保存
              </button>
            </IntentForm>
            <IntentForm
              action={`/my-notebooks/${notebookId}`}
              intent="resetStar"
              fields={{ cardId }}
              onSubmit={() => setOpen(false)}
              className="mt-2"
            >
              <button
                type="submit"
                className="text-xs text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline dark:text-coral-400 dark:hover:text-coral-200"
              >
                0にリセット
              </button>
            </IntentForm>
          </div>
        </>
      )}
    </div>
  );
}
