import { getSessionCookie } from "better-auth/cookies";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from "react-router";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StreakCelebration from "@/components/study/StreakCelebration";
import { getPendingCelebration } from "@/lib/server/study-events.server";
import { getAllLanguageSections } from "@/lib/shared/learn/content";
import { LANGUAGES } from "@/lib/shared/learn/languages";
import { getRequestPath, runWithRequest } from "@/lib/server/request-context.server";
import { getCurrentUser } from "@/lib/server/session.server";
import type { Route } from "./+types/root";
import "./globals.css";

// ログイン必須のパス
const PROTECTED_PREFIXES = ["/my-notebooks", "/learn", "/history"];

// 全リクエストの入口。リクエストを AsyncLocalStorage に載せて、loader・action から
// requireUser() などを引数なしで呼べるようにする。
// ログイン必須のパスは Cookie の有無だけを見て先に弾く(DBは見ない)。本当の認可チェックは
// 各 loader・action 側の requireUser で行う。
// /login・/signup でログイン済みを追い出す処理はここに置かない(Cookieだけ残って
// セッションが無効だと、requireUser との間でリダイレクトがループするため)
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }, next) => {
    const url = new URL(request.url);
    const isProtected = PROTECTED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
    if (isProtected && !getSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", getRequestPath(request));
      throw redirect(loginUrl.pathname + loginUrl.search);
    }
    return runWithRequest(request, next);
  },
];

export async function loader() {
  // サイドバーで利用する全言語のセクション一覧を取得
  const [allSections, user] = await Promise.all([
    getAllLanguageSections(LANGUAGES.map((l) => l.languageSlug)),
    getCurrentUser(),
  ]);
  // 連続学習日数が節目（10日ごと）に達していれば、どのページでもお祝いメッセージを出す
  const celebration = user ? await getPendingCelebration(user.id) : null;
  return { allSections, userName: user?.name ?? null, celebration };
}

export const meta: Route.MetaFunction = () => [
  { title: "ことりずむ | 多次元単語帳アプリ" },
  {
    name: "description",
    content: "自分だけの多次元単語帳を作って共有できる、多言語対応の暗記学習アプリ。",
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist+Mono&family=Hina+Mincho&family=Noto+Sans+JP:wght@100..900&family=Shippori+Mincho:wght@400;500;600&display=swap",
  },
];

// 初回描画前に保存済みテーマ(未保存ならOS設定)をhtmlの.darkクラスへ反映し、ちらつきを防ぐ
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})()`;
// 同じセッションでスプラッシュ画面(components/SplashScreen.tsx)を表示済みなら、初回描画前に非表示にする
const SPLASH_SCRIPT = `(function(){try{if(sessionStorage.getItem("vb-splash-seen"))document.documentElement.classList.add("vb-splash-seen");}catch(e){}})()`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// ルートレイアウト(全ページ共通でHeader, Sidebar, Footerを一元管理)
export default function App({ loaderData }: Route.ComponentProps) {
  const { allSections, userName, celebration } = loaderData;
  return (
    <>
      <Header allSections={allSections} userName={userName} />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar 内部で、/ などのTOPページでは表示しない判定をしている */}
        <Sidebar allSections={allSections} />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
      <Footer />
      {celebration && <StreakCelebration key={celebration} milestone={celebration} />}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">
        {notFound ? "ページが見つかりません" : "エラーが発生しました"}
      </h1>
      <a href="/" className="mt-6 underline">
        トップへ戻る
      </a>
    </main>
  );
}
