import { getSections } from "@/lib/shared/learn/content";
import { getLanguage } from "@/lib/shared/learn/languages";
import { getNotebookRole } from "@/lib/server/notebook-access.server";
import { getCurrentUser } from "@/lib/server/session.server";
import { recordStudyTime } from "@/lib/server/study-events.server";
import type { StudyTimeReport } from "@/lib/shared/study-time";
import type { Route } from "./+types/route";

// 学習ページを開いていた時間の記録 API（app/hooks/useStudyTimer.ts が一定間隔で送る）

const CLIENT_ID_PATTERN = /^[\w-]{1,64}$/;

function badRequest() {
  return new Response("Bad Request", { status: 400 });
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await request.json()) as Partial<StudyTimeReport>;
  const seconds = Number(body.seconds);
  if (typeof body.clientId !== "string" || !CLIENT_ID_PATTERN.test(body.clientId)) {
    return badRequest();
  }
  if (!Number.isFinite(seconds) || seconds <= 0) return badRequest();

  const activity = body.activity;
  if (activity?.kind === "deck") {
    // 単語帳の学習時間は、今アクセスできる単語帳についてだけ記録する
    if (!(await getNotebookRole(String(activity.deckId), user.id))) return badRequest();
    const eventType =
      activity.mode === "review"
        ? "card_review"
        : activity.mode === "quiz"
          ? "card_quiz"
          : "card_study";
    await recordStudyTime(
      user.id,
      body.clientId,
      { eventType, itemId: activity.deckId, deckId: activity.deckId },
      seconds,
    );
  } else if (activity?.kind === "section") {
    const language = String(activity.language);
    if (!getLanguage(language)) return badRequest();
    const sections = await getSections(language);
    if (!sections.some((s) => s.sectionSlug === activity.sectionSlug)) return badRequest();
    await recordStudyTime(
      user.id,
      body.clientId,
      { eventType: "section_study", itemId: activity.sectionSlug, language },
      seconds,
    );
  } else {
    return badRequest();
  }

  return Response.json({});
}
