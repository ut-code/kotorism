import { useEffect } from "react";

import type { StudyTimeActivity, StudyTimeReport } from "@/lib/shared/study-time";

// 経過を確かめる間隔
const TICK_MS = 15_000;
// この秒数たまったら送る
const REPORT_SECONDS = 30;
// 最後の操作からこの時間が過ぎたら、ページを開いたまま離席しているとみなして数えない
const IDLE_MS = 3 * 60_000;
// スリープ復帰などでタイマーが大きく遅れたとき、その間をまとめて数えないための上限
const MAX_TICK_GAP_MS = TICK_MS * 2;

const INPUT_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

function send(report: StudyTimeReport) {
  // ページを閉じる直前の送信も届くよう keepalive を付ける。失敗しても学習の邪魔はしない
  fetch("/api/study-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {});
}

// 学習ページを開いている時間を計測して、学習カレンダー用に記録する。
// 画面が表示されていて、最後の操作から IDLE_MS 以内の時間だけを数える。activity が null の間は数えない
export function useStudyTimer(activity: StudyTimeActivity | null) {
  // activity は毎レンダリングで別オブジェクトになりうるため、内容が変わったときだけ計測し直す
  const activityKey = activity ? JSON.stringify(activity) : null;

  useEffect(() => {
    if (!activityKey) return;
    const current = JSON.parse(activityKey) as StudyTimeActivity;
    const clientId = crypto.randomUUID();

    let pendingMs = 0;
    let lastTick = Date.now();
    let lastInput = Date.now();
    // 直前の区間（lastTick から今まで）が学習中だったか。区間の始まりの状態でその区間を数えるかを決める
    let active = document.visibilityState === "visible";

    function tick() {
      const now = Date.now();
      if (active) pendingMs += Math.min(now - lastTick, MAX_TICK_GAP_MS);
      lastTick = now;
      active = document.visibilityState === "visible" && now - lastInput < IDLE_MS;
    }

    function flush() {
      tick();
      const seconds = Math.floor(pendingMs / 1000);
      if (seconds < 1) return;
      pendingMs -= seconds * 1000;
      send({ clientId, activity: current, seconds });
    }

    function onInput() {
      lastInput = Date.now();
      // 離席から戻ったときは、離席中の区間を数えずにここから数え直す
      if (!active) tick();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
      else tick();
    }

    const interval = window.setInterval(() => {
      tick();
      if (pendingMs >= REPORT_SECONDS * 1000) flush();
    }, TICK_MS);
    for (const type of INPUT_EVENTS) {
      window.addEventListener(type, onInput, { passive: true, capture: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearInterval(interval);
      for (const type of INPUT_EVENTS) {
        window.removeEventListener(type, onInput, { capture: true });
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [activityKey]);
}
