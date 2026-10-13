import {
  getSectionProgress,
  markSectionReviewed,
  recordSectionQuizAnswer,
  recordSectionView,
  toggleManualSectionTag,
} from "@/lib/learn/actions.server";
import type { Route } from "./+types/route";

// 学習セクションの進捗(苦手タグ・クイズ正答・閲覧履歴)の読み書き API

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const result = await getSectionProgress(
    params.get("language") ?? "",
    params.get("sectionSlug") ?? "",
  );
  return Response.json(result);
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as {
    intent: string;
    language: string;
    sectionSlug: string;
    correct?: boolean;
  };

  switch (body.intent) {
    case "quizAnswer":
      await recordSectionQuizAnswer(body.language, body.sectionSlug, body.correct === true);
      break;
    case "markReviewed":
      await markSectionReviewed(body.language, body.sectionSlug);
      break;
    case "toggleManualTag":
      await toggleManualSectionTag(body.language, body.sectionSlug);
      break;
    case "recordView":
      await recordSectionView(body.language, body.sectionSlug);
      break;
    default:
      return new Response("Bad Request", { status: 400 });
  }
  return Response.json({});
}
