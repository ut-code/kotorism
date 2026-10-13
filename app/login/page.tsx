import type { Metadata } from "next";
import { Suspense } from "react";

import { redirectIfLoggedIn } from "@/lib/session";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ログイン | ことりずむ",
};

export default async function LoginPage() {
  await redirectIfLoggedIn();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ログイン
        </h1>
        {/* LoginForm内のuseSearchParams()が静的プリレンダリングをブロックしないようSuspenseで囲む */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
