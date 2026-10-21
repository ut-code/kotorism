import { getSections } from "@/lib/shared/learn/content";
import { getLanguage } from "@/lib/shared/learn/languages";
import { getNotebookRole } from "@/lib/server/notebook-access.server";
import { getCurrentUser } from "@/lib/server/session.server";
import { recordStudyTime } from "@/lib/server/study-events.server";
import { parseStudyTimeReport } from "@/lib/shared/study-time-schema";
import type { Route } from "./+types/route";

// 学習ページを開いていた時間の記録 API（app/hooks/useStudyTimer.ts が一定間隔で送る）
function badRequest() {
  return new Response("Bad Request", { status: 400 });
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseStudyTimeReport(body);
  if (!parsed.success) return badRequest();
  const { clientId, activity, seconds } = parsed.data;

  if (activity.kind === "deck") {
    // 単語帳の学習時間は、今アクセスできる単語帳についてだけ記録する
    if (!(await getNotebookRole(activity.deckId, user.id))) return badRequest();
    const eventType =
      activity.mode === "review"
        ? "card_review"
        : activity.mode === "quiz"
          ? "card_quiz"
          : "card_study";
    await recordStudyTime(
      user.id,
      clientId,
      { eventType, itemId: activity.deckId, deckId: activity.deckId },
      seconds,
    );
  } else {
    const language = activity.language;
    if (!getLanguage(language)) return badRequest();
    const sections = await getSections(language);
    if (!sections.some((s) => s.sectionSlug === activity.sectionSlug)) return badRequest();
    await recordStudyTime(
      user.id,
      clientId,
      { eventType: "section_study", itemId: activity.sectionSlug, language },
      seconds,
    );
  }

  return Response.json({});
}
