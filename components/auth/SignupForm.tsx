"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/auth-redirect";

function syntheticEmail(username: string): string {
  return `${username}@vocabook.local`;
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setPending(true);
    const { error } = await authClient.signUp.email({
      // 表示名はユーザー名と共通にする（DBのnameは必須のため同じ値を入れる）
      name: username,
      email: syntheticEmail(username),
      password,
      username,
    });

    if (error) {
      setPending(false);
      setError(error.message ?? "登録に失敗しました。");
      return;
    }

    router.push(safeRedirectPath(searchParams.get("redirect")));
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ユーザー名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9_]+"
          title="半角英数字とアンダースコアのみ使用できます"
          required
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/[.3] dark:border-white/[.145] dark:focus:border-white/[.4]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          パスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/[.3] dark:border-white/[.145] dark:focus:border-white/[.4]"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "登録中…" : "アカウントを作成"}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
        すでにアカウントをお持ちの場合は{" "}
        <Link href="/login" className="text-coral-500 hover:underline dark:text-coral-500">
          ログイン
        </Link>
      </p>
    </form>
  );
}
