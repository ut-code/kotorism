import {
  getSectionProgress,
  markSectionReviewed,
  recordSectionQuizAnswer,
  recordSectionView,
  toggleManualSectionTag,
} from "@/lib/server/learn/actions.server";
import { parseLearnAction, parseSectionKey } from "@/lib/shared/learn/schema";
import type { Route } from "./+types/route";

// 学習セクションの進捗(苦手タグ・クイズ正答・閲覧履歴)の読み書き API

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const key = parseSectionKey({
    language: params.get("language"),
    sectionSlug: params.get("sectionSlug"),
  });
  if (!key.success) return new Response("Bad Request", { status: 400 });

  return Response.json(await getSectionProgress(key.data.language, key.data.sectionSlug));
}

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json().catch(() => null);
  const parsed = parseLearnAction(body);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const { language, sectionSlug } = parsed.data;
  switch (parsed.data.intent) {
    case "quizAnswer":
      await recordSectionQuizAnswer(language, sectionSlug, parsed.data.correct);
      break;
    case "markReviewed":
      await markSectionReviewed(language, sectionSlug);
      break;
    case "toggleManualTag":
      await toggleManualSectionTag(language, sectionSlug);
      break;
    case "recordView":
      await recordSectionView(language, sectionSlug);
      break;
  }
  return Response.json({});
}
