import Link from "@/components/Link";
import { useRef } from "react";
import { redirect } from "react-router";
import BookShape from "@/components/BookShape";
import BrandName from "@/components/BrandName";
import SplashScreen from "@/components/SplashScreen";
import BookPage from "@/components/home/BookPage";
import WaveCirclesBackground from "@/components/WaveCirclesBackground";
import { MaterialsContents } from "@/components/home/MaterialsContents";
import { PrismList } from "@/components/home/PrismList";
import { StudyModePreview } from "@/components/home/StudyModePreview";
import { getCurrentUser } from "@/lib/server/session.server";
import { getAllLanguageSections } from "@/lib/shared/learn/content";
import { LANGUAGES } from "@/lib/shared/learn/languages";
import type { Route } from "./+types/route";

// My単語帳のページに並べる、できることの一覧
const NOTEBOOK_FEATURES = [
  "オリジナルの単語帳を作る",
  "Excelやスプレッドシートから単語を取り込む",
  "暗記学習モードで覚える",
  "★をつけてブックマークする",
  "★だけを復習する",
  "クイズを解く",
  "友達と共有する",
];

// ボタン内の、ホバー中に右へ流れ続ける矢印（アニメーションはglobals.cssのvb-arrow-*）
function FlowArrow() {
  return (
    <span className="vb-arrow-window" aria-hidden="true">
      <span className="vb-arrow-track">
        <svg viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7H12M12 7L8 3M12 7L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7H12M12 7L8 3M12 7L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7H12M12 7L8 3M12 7L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7H12M12 7L8 3M12 7L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

// ルートページ
// ログイン中は閲覧履歴ページへ移し、未ログインのときだけこのトップページ（サービス紹介）を表示する。
// 判定はCookieではなくDB上のセッションで行う（無効なCookieが残っていてもループしないように。root.tsx の middleware と同じ理由）
export async function loader() {
  if (await getCurrentUser()) {
    throw redirect("/history");
  }
  // 学習教材のページに並べる、言語ごとの教材のセクション
  const sections = await getAllLanguageSections(LANGUAGES.map((lang) => lang.languageSlug));
  return { sections };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const heroContentRef = useRef<HTMLDivElement>(null);
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <SplashScreen />
      {/* 上paddingはglobals.cssの.vb-heroで指定。md未満では下も同じ値にして白い本を上下中央に置く */}
      <section className="vb-hero relative flex w-full flex-col items-center overflow-hidden px-6 pb-(--vb-hero-pt) text-center md:pb-8">
        <WaveCirclesBackground contentRef={heroContentRef} />
        <div ref={heroContentRef} className="relative z-10 flex max-w-3xl flex-col items-center">
          {/* md未満では見出し〜ボタンを白い本に載せる（ボタンも本に収まるよう gap を詰める）。md以上では本は出さない */}
          <BookShape className="gap-4 md:gap-6">
            <div className="relative flex flex-col items-center gap-6">
              <h1
                className="relative tracking-[0.06em] text-black dark:text-zinc-50"
                style={{
                  textShadow: "0 2px 24px rgba(0,0,0,0.12)",
                  fontSize: "var(--vb-title)",
                }}
              >
                <BrandName />
              </h1>
              <p
                className="w-max max-w-[min(36rem,calc(100vw-3rem))] font-serif text-[13px] font-medium leading-8 tracking-[0.08em] text-zinc-600 sm:text-lg sm:leading-9 sm:tracking-[0.15em] dark:text-zinc-400"
                // ことりずむの見出し(h1)はBebas Neueのディセンダー分の余白が下に大きく、
                // gap-6だけだと文字の見た目より間隔が広く見えるため、フォントサイズ(--vb-title)に
                // 比例させて少し引き上げて詰めている
                // w-max: 本より長い説明文を本の幅で折り返さない（画面の幅を超える場合だけ折り返す）
                style={{ marginTop: "calc(-0.278 * var(--vb-title))" }}
              >
                ことばにプリズムをかざすと、様々な要素が見える。
                <br />
                多言語を多次元で学ぶための語学アプリ。
              </p>
            </div>
            {/* md未満ではボタンの列を「ことりずむ」の幅（5.3 × --vb-title）にそろえ、白い本に収める */}
            <div className="grid w-[calc(5.3*var(--vb-title))] grid-cols-2 gap-3 md:mt-4 md:flex md:w-auto md:justify-center md:gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-coral-500 py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-coral-600 md:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
              >
                新規登録する
                {/* 幅の狭い画面ではボタン内に収まらないため矢印を省く */}
                <span className="inline-flex max-[379px]:hidden">
                  <FlowArrow />
                </span>
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-[#7FCDCC] py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-[#5BB5B4] md:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
              >
                ログインする
                {/* 幅の狭い画面ではボタン内に収まらないため矢印を省く */}
                <span className="inline-flex max-[379px]:hidden">
                  <FlowArrow />
                </span>
              </Link>
            </div>
          </BookShape>
        </div>
      </section>

      {/* PCでは2枚を開いた本の左右のページとして並べ（左: My単語帳、右: 学習教材）、スマホ・タブレットでは縦に積む。
          学習教材の項目名が長く、2列だと折り返しやすいため、PC幅では画面いっぱい（1280pxまで）に本を広げる */}
      <section className="grid w-full max-w-5xl grid-cols-1 gap-8 px-6 pb-28 md:grid-cols-2 md:gap-5 lg:max-w-7xl lg:px-10">
        {/* My単語帳のページは紹介のための表示だけで、押してもページは移らない（登録・ログインは上のボタンから） */}
        <BookPage side="left" className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold text-coral-900 dark:text-coral-100">My単語帳</h2>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
              単語帳を思いのままに好きなだけ作って、暗記できます。
            </p>
          </div>
          <PrismList
            items={NOTEBOOK_FEATURES}
            className="text-[15px] leading-10 font-medium text-zinc-800 dark:text-zinc-200"
            tone="coral"
            ruleOffset={7}
            marker={false}
          />
          <div className="mt-auto">
            <StudyModePreview />
          </div>
        </BookPage>

        <BookPage side="right" className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold text-tealblue-900 dark:text-tealblue-100">
              学習教材
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
              中国語、フランス語、ドイツ語、スペイン語の4言語が学べます。
            </p>
          </div>
          <MaterialsContents sections={loaderData.sections} />
        </BookPage>
      </section>
    </main>
  );
}
