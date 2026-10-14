"use client";

import { useState } from "react";
import { useFetcher } from "react-router";

// 単語帳の公開/非公開を切り替え、公開中は共有リンクをコピーできるボタン
export default function ShareNotebookButton({
  notebookId,
  isPublic,
}: {
  notebookId: string;
  isPublic: boolean;
}) {
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";
  // 送信中は切り替え後の状態を先に見せる(楽観的UI)
  const optimisticPublic = isPending ? !isPublic : isPublic;
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/${notebookId}` : "";

  function handleToggle() {
    fetcher.submit(
      { intent: "togglePublic" },
      { method: "post", action: `/my-notebooks/${notebookId}` },
    );
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-full border border-coral-300 px-5 py-2 text-sm font-medium text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 disabled:opacity-50 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
      >
        {optimisticPublic ? "公開中（クリックで非公開に）" : "リンクで共有する"}
      </button>
      {optimisticPublic && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="w-64 rounded-full border border-black/[.08] bg-white px-4 py-2 text-xs text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-coral-300 px-4 py-2 text-xs font-medium text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
      )}
    </div>
  );
}
