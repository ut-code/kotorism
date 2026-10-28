import { useState } from "react";

import { authClient } from "@/lib/shared/auth-client";

// ユーザー名・パスワードで登録した既存ユーザーが、パスワードログインの廃止後もログインできるよう Google を紐付ける
export default function LinkGoogleButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await authClient.linkSocial({ provider: "google", callbackURL: "/my-notebooks" });
  }

  return (
    <section className="mt-8 w-full max-w-md rounded-2xl border border-coral-200 bg-coral-50 p-5 text-center dark:border-coral-900/40 dark:bg-zinc-950">
      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        ユーザー名・パスワードでのログインは終了します。今のデータを引き続き使うには、Google
        アカウントを連携してください。
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="mt-3 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Google へ移動中…" : "Google アカウントを連携"}
      </button>
    </section>
  );
}
