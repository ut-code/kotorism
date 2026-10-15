import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";

import Link from "@/components/Link";
import { STREAK_MILESTONE_INTERVAL } from "@/lib/study-events";

// 節目ごとのひとこと。用意した数を超えたら最後のものを繰り返す
const MESSAGES = [
  "まずは最初の大きな一歩。毎日の積み重ねが、確かな力になっています。",
  "学習がすっかり習慣になってきましたね。この調子で続けましょう！",
  "1ヶ月続けられるのは本物の力です。自分をたくさん褒めてあげてください。",
  "40日連続！ことばの世界がどんどん広がっています。",
  "50日、すごい継続力です。ここまでの努力は必ず実を結びます。",
  "続けることが一番の才能。これからも一緒に学んでいきましょう！",
];

function messageFor(milestone: number): string {
  const index = milestone / STREAK_MILESTONE_INTERVAL - 1;
  return MESSAGES[Math.min(index, MESSAGES.length - 1)];
}

// 連続学習日数が10日の倍数に達したときに出すお祝いメッセージ。閉じると同じ節目は二度と出さない
export default function StreakCelebration({ milestone }: { milestone: number }) {
  const fetcher = useFetcher();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 閉じた直後（loader の再実行を待つ間）も消えたままにする
  const dismissed = fetcher.state !== "idle" || fetcher.data !== undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dismissed && !dialog.open) dialog.showModal();
  }, [dismissed, milestone]);

  function acknowledge() {
    dialogRef.current?.close();
    void fetcher.submit(
      { intent: "acknowledge", milestone: String(milestone) },
      { method: "post", action: "/api/study-streak" },
    );
  }

  if (dismissed) return null;

  return (
    <dialog
      ref={dialogRef}
      // Esc キーで閉じた場合も表示済みとして記録する
      onCancel={acknowledge}
      aria-labelledby="streak-celebration-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-center shadow-2xl backdrop:bg-black/40 dark:bg-zinc-900"
    >
      <div className="bg-gradient-to-b from-coral-100 to-white px-6 pt-8 pb-2 dark:from-coral-950 dark:to-zinc-900">
        <div className="text-5xl" aria-hidden="true">
          🎉
        </div>
        <p className="mt-3 text-sm font-medium text-coral-700 dark:text-coral-300">連続学習</p>
        <h2
          id="streak-celebration-title"
          className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          {milestone}日達成！
        </h2>
      </div>
      <p className="px-6 pt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {messageFor(milestone)}
      </p>
      <p className="px-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
        次の目標は {milestone + STREAK_MILESTONE_INTERVAL}日連続です。
      </p>
      <div className="flex flex-col gap-2 px-6 pt-6 pb-6">
        <button
          type="button"
          onClick={acknowledge}
          autoFocus
          className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-600"
        >
          ありがとう！
        </button>
        <Link
          href="/history"
          onClick={acknowledge}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          学習カレンダーを見る
        </Link>
      </div>
    </dialog>
  );
}
