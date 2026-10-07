import RecentActivity from "@/components/home/RecentActivity";
import { requireUser } from "@/lib/session";

// ログイン後の入口。最近見た単語帳・学習ページを表示する（未ログインなら /login へ）
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          最近の学習履歴
        </h1>
        <RecentActivity userId={user.id} />
      </div>
    </main>
  );
}
