import LoginForm from "@/components/auth/LoginForm";

// Google を連携する前の既存ユーザーが先に「Google でログイン」を押すと、データのない別のアカウントができてしまい、
// その Google アカウントは元のアカウントに連携できなくなる。そうならないよう、Google のボタンより先に目に入る位置で案内する
export function LegacyLoginNotice() {
  return (
    <p
      role="note"
      className="rounded-lg bg-coral-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
    >
      以前ユーザー名で登録した方へ:
      先に下の「以前のユーザー名でログインする」からログインし、My単語帳で「Google
      アカウントを連携」を押してください。連携する前に Google
      でログインすると、データのない別のアカウントができてしまいます。
    </p>
  );
}

export function LegacyLoginForm() {
  return (
    <details className="border-t border-black/[.08] pt-4 text-sm dark:border-white/[.145]">
      <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400">
        以前のユーザー名でログインする
      </summary>
      <LoginForm />
    </details>
  );
}
