import { redirectIfLoggedIn } from "@/lib/server/session.server";
import type { Route } from "./+types/route";
import LoginForm from "@/components/auth/LoginForm";

export const meta: Route.MetaFunction = () => [{ title: "ログイン | ことりずむ" }];

export async function loader() {
  await redirectIfLoggedIn();
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ログイン
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
