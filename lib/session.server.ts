import { redirect } from "react-router";

import { auth } from "@/lib/auth.server";
import { getRequestStore } from "@/lib/request-context.server";

// 1リクエスト内で何度呼んでもDBアクセスは1回だけになるよう、リクエストのストアにメモ化する
export function getCurrentUser() {
  const store = getRequestStore();
  store.user ??= auth.api
    .getSession({ headers: store.request.headers })
    .then((session) => session?.user ?? null);
  return store.user;
}

// ログインしていなければ /login に差し戻す。loader・action の両方から使う
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // 元のパスを /login?redirect= に渡し、ログイン後にそこへ戻れるようにする
    const url = new URL(getRequestStore().request.url);
    const path = url.pathname + url.search;
    throw redirect(`/login?redirect=${encodeURIComponent(path)}`);
  }
  return user;
}

// ログイン済みなら /my-notebooks へ移動する。/login・/signup から使う。
// Cookieの有無ではなくDB上のセッションで判定するので、無効なCookieが残っていてもループしない
export async function redirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) {
    throw redirect("/my-notebooks");
  }
}
