import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // OGP画像などの相対URLを絶対URLにするための基準。アプリのオリジンは認証と同じ環境変数を使う
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: "Vocabook | 多次元単語帳アプリ",
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
      className={`${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 初回描画前に保存済みテーマ（未保存ならOS設定）をhtmlの.darkクラスへ反映し、ちらつきを防ぐ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})()`,
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
