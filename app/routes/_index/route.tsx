import Link from "@/components/Link";
import { redirect } from "react-router";
import BookShape from "@/components/BookShape";
import BrandName from "@/components/BrandName";
import ShapeDivider from "@/components/ShapeDivider";
import SplashScreen from "@/components/SplashScreen";
// デザイン調整中のため、見出し後ろの流体シェイプを一時的に外している
// import TitleBlob from "@/components/TitleBlob";
import { MaterialsPreview } from "@/components/home/MaterialsPreview";
import { StudyModePreview } from "@/components/home/StudyModePreview";
import { getCurrentUser } from "@/lib/server/session.server";

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
  return null;
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <SplashScreen />
      {/* 上padding・高さはglobals.cssの.vb-heroで指定（スマホでは1画面ぴったりの高さ） */}
      <section className="vb-hero relative flex w-full flex-col items-center overflow-hidden px-6 pb-10 text-center sm:pb-24">
        {/* ヘッダー直下に垂れ下がる波形の区切り。
        position・height・widthPercent・fillClassName・flipXで見た目を試せる */}
        <ShapeDivider widthPercent={184.5} height={159} />
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
          {/* 本の形は、見出し・説明文をまとめたこのdivにぶら下げる。このdivは中身の
          実際の幅（ことりずむか説明文の広い方）と高さにシュリンクラップされるため、
          本の形がどの画面幅でも文字全体を覆う */}
          <div className="relative flex flex-col items-center gap-6">
            <BookShape />
            <h1
              className="relative tracking-[0.06em] text-black dark:text-zinc-50"
              style={{
                textShadow: "0 2px 24px rgba(0,0,0,0.12)",
                fontSize: "var(--vb-title)",
              }}
            >
              {/* <TitleBlob /> */}
              <BrandName />
            </h1>
            <p
              className="max-w-xl font-serif text-[13px] font-medium leading-8 tracking-[0.08em] text-zinc-600 sm:text-lg sm:leading-9 sm:tracking-[0.15em] dark:text-zinc-400"
              // ことりずむの見出し(h1)はBebas Neueのディセンダー分の余白が下に大きく、
              // gap-6だけだと文字の見た目より間隔が広く見えるため、フォントサイズ(--vb-title)に
              // 比例させて少し引き上げて詰めている
              style={{ marginTop: "calc(-0.278 * var(--vb-title))" }}
            >
              ことばにプリズムをかざすと、様々な要素が見える。
              <br />
              多言語を多次元で学ぶための語学アプリ。
            </p>
          </div>
          <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:mt-4 sm:flex sm:w-auto sm:justify-center sm:gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-zinc-900 py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-black dark:bg-zinc-700 dark:hover:bg-zinc-800 sm:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
            >
              新規登録する
              {/* 幅の狭い画面ではボタン内に収まらないため矢印を省く */}
              <span className="inline-flex max-[379px]:hidden">
                <FlowArrow />
              </span>
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-[#7FCDCC] py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-[#5BB5B4] sm:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
            >
              ログインする
              {/* 幅の狭い画面ではボタン内に収まらないため矢印を省く */}
              <span className="inline-flex max-[379px]:hidden">
                <FlowArrow />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* PCでは2枚のカードを左右に並べ、スマホ・タブレットでは縦に積む。
          PCでは各カードを「文章」「プレビュー/言語ボタン」の2行のsubgridにして、2枚の行の高さをそろえる
          （学習教材の言語ボタンを、My単語帳のプレビュー画像の縦の中心に合わせるため） */}
      <section className="grid w-full max-w-5xl grid-cols-1 gap-8 px-6 pb-28 md:grid-cols-2 md:gap-6">
        {/* カードは紹介のための表示だけで、押してもページは移らない（登録・ログインは上のボタンから） */}
        <div className="relative flex flex-col gap-6 rounded-3xl border border-coral-200 bg-white p-8 text-left sm:flex-row sm:items-center sm:gap-12 sm:p-9 md:row-span-2 md:grid md:grid-rows-subgrid md:items-start md:gap-8 dark:border-coral-900/40 dark:bg-zinc-950">
          <div className="flex flex-col gap-6 sm:flex-1">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-coral-900 dark:text-coral-100">My単語帳</h2>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                意味・発音・例文など複数の軸を持つ、
                <br className="hidden sm:inline" />
                オリジナルの単語帳を作成。他の人との共有もできます。
              </p>
            </div>
          </div>

          <div className="sm:w-[42%] md:w-full">
            <StudyModePreview />
          </div>
        </div>

        <div className="relative flex flex-col gap-6 rounded-3xl border border-tealblue-200 bg-white p-8 text-left sm:gap-8 sm:p-9 md:row-span-2 md:grid md:grid-rows-subgrid dark:border-tealblue-900/40 dark:bg-zinc-950">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-tealblue-900 dark:text-tealblue-100">
              学習教材
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
              単語帳を自分で作らなくても、
              <br />
              多言語対応の暗記教材ですぐに学習を始められます。
            </p>
          </div>

          <MaterialsPreview />
        </div>
      </section>
    </main>
  );
}
