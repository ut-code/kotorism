import { useSearchParams } from "react-router";

import { passwordAuth } from "@/lib/server/auth.server";
import { redirectIfLoggedIn } from "@/lib/server/session.server";
import type { Route } from "./+types/route";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import LoginForm from "@/components/auth/LoginForm";

export const meta: Route.MetaFunction = () => [{ title: "ログイン | ことりずむ" }];

export async function loader() {
  await redirectIfLoggedIn();
  return { passwordLogin: passwordAuth.login };
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  const { passwordLogin } = loaderData;
  // Google ログインに失敗すると better-auth が ?error=<理由> をつけてここへ戻す
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ログイン
        </h1>
        <div className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <GoogleSignInButton label="Google でログイン" />
          {oauthError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Google でのログインに失敗しました。もう一度お試しください。
            </p>
          )}
          {passwordLogin && (
            <details className="border-t border-black/[.08] pt-4 text-sm dark:border-white/[.145]">
              <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400">
                以前のユーザー名でログインする
              </summary>
              <LoginForm />
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
