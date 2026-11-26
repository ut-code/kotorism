import { redirect } from "react-router";

import type { Route } from "./+types/route";

// ログインと新規登録は /login の1画面にまとめた（Google ログインは初回にそのまま登録される）。
// 古いリンクやブックマークから来た人のために、戻り先（?redirect=）などのクエリを保ったまま転送する
export function loader({ request }: Route.LoaderArgs) {
  const { search } = new URL(request.url);
  throw redirect(`/login${search}`, 301);
}
