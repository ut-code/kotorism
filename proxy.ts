import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ログイン必須のパス
const PROTECTED_PREFIX = "/my-notebooks";

// Cookieの有無だけを見る楽観的チェック（DBは見ない）。
// 本当の認可チェックは各ページ・Server Action側（lib/session.ts の requireUser）で行う。
// /login・/signup でログイン済みを追い出す処理はここに置かない（Cookieだけ残って
// セッションが無効だと、requireUser との間でリダイレクトがループするため）
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (pathname.startsWith(PROTECTED_PREFIX) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/my-notebooks/:path*"],
};
