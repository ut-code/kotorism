import { requireUser } from "@/lib/server/session.server";
import { updateDisplayName } from "@/lib/server/profile.server";
import type { Route } from "./+types/route";

// ヘッダーの名前の編集(components/DisplayNameEditor.tsx)から useFetcher で送る。
// 処理後にルートの loader が再実行され、ヘッダーの名前が新しいものに変わる
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser();
  const formData = await request.formData();
  return updateDisplayName(user.id, formData.get("name"));
}
