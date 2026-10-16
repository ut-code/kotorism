import { getEssayHistory, submitEssay } from "@/lib/server/essay/actions.server";
import type { Route } from "./+types/route";

// 作文の提出履歴の取得と、提出・AI添削 API

export async function loader({ request }: Route.LoaderArgs) {
  const language = new URL(request.url).searchParams.get("language") ?? "";
  return Response.json(await getEssayHistory(language));
}

export async function action({ request }: Route.ActionArgs) {
  return Response.json(await submitEssay(await request.json()));
}
