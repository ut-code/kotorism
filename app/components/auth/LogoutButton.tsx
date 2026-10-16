import { useState } from "react";

import { authClient } from "@/lib/shared/auth-client";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await authClient.signOut();
    // ログイン状態が変わったので、全体を読み込み直す
    window.location.assign("/");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="whitespace-nowrap rounded-full border border-black/[.08] px-4 py-1.5 text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {pending ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}
