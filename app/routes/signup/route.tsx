import { useRef } from "react";

import { redirectIfLoggedIn } from "@/lib/server/session.server";
import type { Route } from "./+types/route";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import WaveCirclesBackground from "@/components/WaveCirclesBackground";

export const meta: Route.MetaFunction = () => [{ title: "新規登録 | ことりずむ" }];

export async function loader() {
  await redirectIfLoggedIn();
  return null;
}

export default function SignupPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-24">
      {/* 白い円の中心をカードに合わせる */}
      <WaveCirclesBackground contentRef={cardRef} />
      <div className="relative w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          新規登録
        </h1>
        <div
          ref={cardRef}
          className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/30 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-white/15 dark:bg-white/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <GoogleSignInButton label="Google で登録" />
        </div>
      </div>
    </main>
  );
}
