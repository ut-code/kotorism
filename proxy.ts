import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ログイン必須のパス
const PROTECTED_PREFIXES = ["/my-notebooks", "/learn"];

// 元のパスを requireUser へ伝えるヘッダー名（lib/session.ts と揃える）
const PATH_HEADER = "x-pathname";

// Cookieの有無だけを見る楽観的チェック（DBは見ない）。
// 本当の認可チェックは各ページ・Server Action側（lib/session.ts の requireUser）で行う。
// /login・/signup でログイン済みを追い出す処理はここに置かない（Cookieだけ残って
// セッションが無効だと、requireUser との間でリダイレクトがループするため）
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // requireUser が未ログイン時に元のパスを /login?redirect= へ渡せるよう、リクエストヘッダーに載せる
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/my-notebooks/:path*", "/learn/:path*", "/history"],
};
