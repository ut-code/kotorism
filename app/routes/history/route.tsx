import RecentActivity from "@/components/home/RecentActivity";
import { requireUser } from "@/lib/server/session.server";
import { getRecentNotebooks, getRecentSections } from "@/lib/server/recent-activity.server";
import type { Route } from "./+types/route";

// ログイン後の入口。最近見た単語帳・学習ページを表示する（未ログインなら /login へ）
export async function loader() {
  const user = await requireUser();
  const [notebooks, sections] = await Promise.all([
    getRecentNotebooks(user.id),
    getRecentSections(user.id),
  ]);

  return { notebooks, sections };
}

export default function HistoryPage({ loaderData }: Route.ComponentProps) {
  const { notebooks, sections } = loaderData;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          最近の学習履歴
        </h1>
        <RecentActivity notebooks={notebooks} sections={sections} />
      </div>
    </main>
  );
}
