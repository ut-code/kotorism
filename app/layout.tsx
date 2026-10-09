import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { getAllLanguageSections } from "@/app/learn/content";
import { LANGUAGES } from "@/app/learn/languages";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: "variable",
});

// サイト共通の明朝体（font-serif）。キャッチコピー・背景の単語・フッターのリンクで使う
const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ことりずむ | 多次元単語帳アプリ",
  description: "自分だけの多次元単語帳を作って共有できる、多言語対応の暗記学習アプリ。",
};

// ルートレイアウト（全ページ共通でHeader, Sidebar, Footerを一元管理）
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // サイドバーで利用する全言語のセクション一覧を取得
  const allSections = await getAllLanguageSections(LANGUAGES.map((l) => l.languageSlug));

  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${shipporiMincho.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 初回描画前に保存済みテーマ（未保存ならOS設定）をhtmlの.darkクラスへ反映し、ちらつきを防ぐ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})()`,
          }}
        />
        {/* 同じセッションでスプラッシュ画面（components/SplashScreen.tsx）を表示済みなら、初回描画前に非表示にする */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem("vb-splash-seen"))document.documentElement.classList.add("vb-splash-seen");}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col md:flex-row">
          {/* ルートレイアウト直下にSidebarを組み込み（/ などのTOPページではSidebar内部で表示を判定制御） */}
          <Sidebar allSections={allSections} />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
        <Footer />
      </body>
    </html>
  );
}
