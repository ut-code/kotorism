import { requireUser } from "@/lib/server/session.server";
import { parseAcknowledgeStreak } from "@/lib/shared/study-streak-schema";
import { acknowledgeCelebration } from "@/lib/server/study-events.server";
import type { Route } from "./+types/route";

// 連続学習のお祝いメッセージ（components/study/StreakCelebration.tsx）を閉じたときの記録 API。
// useFetcher から送るので、処理後にルートの loader が再実行されてメッセージが消える
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser();
  const formData = await request.formData();
  const parsed = parseAcknowledgeStreak(formData);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });
  await acknowledgeCelebration(user.id, parsed.data.milestone);
  return {};
}
