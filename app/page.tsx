import Link from "next/link";
import { redirect } from "next/navigation";

import Background from "@/components/background";
import BookShape from "@/components/book-shape";
import SplashScreen from "@/components/SplashScreen";
import { MaterialsPreview } from "@/components/home/MaterialsPreview";
import { StudyModePreview } from "@/components/home/StudyModePreview";
import { getCurrentUser } from "@/lib/session";

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
// 判定はCookieではなくDB上のセッションで行う（無効なCookieが残っていてもループしないように。proxy.tsと同じ理由）
export default async function Home() {
  if (await getCurrentUser()) {
    redirect("/history");
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <SplashScreen />
      {/* 上padding・高さはglobals.cssの.vb-heroで指定（スマホでは1画面ぴったりの高さ） */}
      <section className="vb-hero relative flex w-full flex-col items-center overflow-hidden px-6 pb-10 text-center sm:pb-24">
        <Background />
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
          {/* 本の形は、バッジ・見出し・説明文をまとめたこのdivにぶら下げる。このdivは中身の
          実際の幅（VOCABOOKか説明文の広い方）と高さにシュリンクラップされるため、
          本の形がどの画面幅でも文字全体を覆う */}
          <div className="relative flex flex-col items-center gap-6">
            <BookShape />
            <span
              className="inline-flex items-center gap-3 font-serif text-xs font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-500"
            >
              <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />
              多言語対応 語学暗記アプリ
              <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />
            </span>
            <h1
              className="relative tracking-[0.06em] text-black dark:text-zinc-50"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.12)", fontSize: "var(--vb-title)" }}
            >
              ことりずむ
            </h1>
            <p
              className="max-w-xl font-serif text-[13px] font-medium leading-8 tracking-[0.08em] text-zinc-600 sm:text-lg sm:leading-9 sm:tracking-[0.15em] dark:text-zinc-400"
              // VOCABOOKの見出し(h1)はBebas Neueのディセンダー分の余白が下に大きく、
              // gap-6だけだと文字の見た目より間隔が広く見えるため、フォントサイズ(--vb-title)に
              // 比例させて少し引き上げて詰めている
              style={{ marginTop: "calc(-0.278 * var(--vb-title))" }}
            >
              自分だけの多次元単語帳を作って共有できる、
              <br />
              多言語対応の語学暗記アプリ。
            </p>
          </div>
          {/* すぐに使い始められるよう、各機能への導線を見出しのすぐ下に置く。
          左右対称に見えるよう、2つのボタンは同じ幅に揃える（スマホでも縦に積まず横に並べて、
          1画面に収まるようにする）。
          本の形が説明文の下にはみ出す分と重ならないよう、上に余白を足す */}
          <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:mt-4 sm:flex sm:w-auto sm:justify-center sm:gap-4">
            <Link
              href="/my-notebooks"
              className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-coral-500 py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-coral-600 sm:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
            >
              ログインして使ってみる
              {/* 幅の狭いスマホではボタン内に収まらないため矢印を省く */}
              <span className="inline-flex max-[379px]:hidden">
                <FlowArrow />
              </span>
            </Link>
            <Link
              href="/learn"
              className="group inline-flex items-center justify-center gap-1 rounded-full px-2 bg-tealblue-600 py-4 text-sm font-bold max-[379px]:text-[13px] text-white transition-colors hover:bg-tealblue-700 sm:w-60 sm:gap-2 sm:px-0 sm:py-4 sm:text-base"
            >
              ログインなしで学習する
              {/* 幅の狭いスマホではボタン内に収まらないため矢印を省く */}
              <span className="inline-flex max-[379px]:hidden">
                <FlowArrow />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* カードは縦に並べ、各カードの中で説明文と機能のプレビューを横に並べる。
      プレビューの位置はカードごとに左右交互（My単語帳は右、学習教材は左） */}
      <section className="flex w-full max-w-5xl flex-col gap-8 px-6 pb-28">
        <div className="group relative flex flex-col gap-6 rounded-3xl border border-coral-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-coral-300 hover:shadow-xl hover:shadow-coral-100 sm:flex-row sm:items-center sm:gap-12 sm:p-9 dark:border-coral-900/40 dark:bg-zinc-950 dark:hover:border-coral-700/60 dark:hover:shadow-none">
          <Link
            href="/my-notebooks"
            className="absolute inset-0 z-0 rounded-3xl"
            aria-label="ログインして使ってみる"
          />

          <div className="flex flex-col gap-6 sm:flex-1">
            <div className="pointer-events-none relative z-10">
              <h2 className="text-3xl font-bold text-coral-900 dark:text-coral-100">My単語帳</h2>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                意味・発音・例文など複数の軸を持つ、
                {/* スマホでは幅が狭く「つ、」だけが1行に残るため、改行はsm以上のみ */}
                <br className="hidden sm:inline" />
                自分だけの単語帳を作成。そのまま他の人と共有できます。
              </p>
            </div>
          </div>

          <div className="sm:w-[42%]">
            <StudyModePreview />
          </div>
        </div>

        <div className="group relative flex flex-col gap-6 rounded-3xl border border-tealblue-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-tealblue-300 hover:shadow-xl hover:shadow-tealblue-100 sm:flex-row-reverse sm:items-center sm:gap-12 sm:p-9 dark:border-tealblue-900/40 dark:bg-zinc-950 dark:hover:border-tealblue-700/60 dark:hover:shadow-none">
          <Link
            href="/learn"
            className="absolute inset-0 z-0 rounded-3xl"
            aria-label="ログインなしで学習する"
          />

          <MaterialsPreview>
            <div className="pointer-events-none relative z-10">
              <h2 className="text-3xl font-bold text-tealblue-900 dark:text-tealblue-100">
                学習教材
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                単語帳を自分で作らなくても、
                <br />
                多言語対応の暗記教材ですぐに学習を始められます。
              </p>
            </div>
          </MaterialsPreview>
        </div>
      </section>
    </main>
  );
}
