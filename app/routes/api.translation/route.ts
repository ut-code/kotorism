import { getTranslationHistory, submitTranslation } from "@/lib/server/translation/actions.server";
import type { Route } from "./+types/route";

// 翻訳練習の提出履歴の取得と、提出・AI添削 API

export async function loader({ request }: Route.LoaderArgs) {
  const language = new URL(request.url).searchParams.get("language") ?? "";
  return Response.json(await getTranslationHistory(language));
}

export async function action({ request }: Route.ActionArgs) {
  return Response.json(await submitTranslation(await request.json()));
}
