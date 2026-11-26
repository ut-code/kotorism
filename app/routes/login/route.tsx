import { useRef } from "react";
import { useSearchParams } from "react-router";

import { redirectIfLoggedIn } from "@/lib/server/session.server";
import type { Route } from "./+types/route";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import WaveCirclesBackground from "@/components/WaveCirclesBackground";

export const meta: Route.MetaFunction = () => [{ title: "ログイン / 新規登録 | ことりずむ" }];

export async function loader() {
  await redirectIfLoggedIn();
  return null;
}

// ログインすると使えるようになること。初めて来た人に、Google アカウントを求める理由を伝える
const BENEFITS = [
  "単語帳を作って保存し、暗記学習やクイズで覚えられます",
  "学習教材の練習や学習時間が記録され、カレンダーで振り返れます",
  "無料で使えます。初めての方もこのボタンからそのまま登録できます",
] as const;

// Google ログインは初回にそのままアカウントが作られるので、ログインと新規登録をこの1画面にまとめている
// （/signup はここへ転送する）
export default function LoginPage() {
  // Google ログインに失敗すると better-auth が ?error=<理由> をつけてここへ戻す
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-24">
      {/* 白い円の中心をカードに合わせる */}
      <WaveCirclesBackground contentRef={cardRef} />
      <div className="relative w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ログイン / 新規登録
        </h1>
        <div
          ref={cardRef}
          className="flex flex-col gap-5 rounded-2xl border border-white/70 bg-white/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <GoogleSignInButton label="Google でログイン / 新規登録" />
          {oauthError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Google でのログインに失敗しました。もう一度お試しください。
            </p>
          )}
          <ul className="flex flex-col gap-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span aria-hidden="true" className="text-tealblue-700 dark:text-tealblue-300">
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
