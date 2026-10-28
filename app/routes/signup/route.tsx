import { redirectIfLoggedIn } from "@/lib/server/session.server";
import type { Route } from "./+types/route";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export const meta: Route.MetaFunction = () => [{ title: "新規登録 | ことりずむ" }];

export async function loader() {
  await redirectIfLoggedIn();
  return null;
}

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          新規登録
        </h1>
        <div className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <GoogleSignInButton label="Google で登録" />
        </div>
      </div>
    </main>
  );
}
