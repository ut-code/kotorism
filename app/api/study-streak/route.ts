import { requireUser } from "@/lib/session.server";
import { acknowledgeCelebration } from "@/lib/study-events.server";
import type { Route } from "./+types/route";

// 連続学習のお祝いメッセージ（components/study/StreakCelebration.tsx）を閉じたときの記録 API。
// useFetcher から送るので、処理後にルートの loader が再実行されてメッセージが消える
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser();
  const formData = await request.formData();
  const milestone = Number(formData.get("milestone"));
  if (formData.get("intent") !== "acknowledge" || !Number.isInteger(milestone) || milestone <= 0) {
    return new Response("Bad Request", { status: 400 });
  }
  await acknowledgeCelebration(user.id, milestone);
  return {};
}
