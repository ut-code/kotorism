"use client";

import Image from "next/image";

// sessionStorageのキー。layout.tsxの<head>内スクリプトでも同じキーを参照している
const SPLASH_SEEN_KEY = "vb-splash-seen";

// LP表示前に出すスプラッシュ画面。表示・フェードアウトはglobals.cssのCSSアニメーションだけで行うため、
// JSの読み込みを待たずに消える。2回目以降（同じセッション内）はhtmlの.vb-splash-seenクラスで非表示にする
export default function SplashScreen() {
  // フェードアウトが終わったら「表示済み」を記録し、クライアント遷移で戻ってきても再表示しないようにする
  function handleAnimationEnd(event: React.AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {}
    document.documentElement.classList.add("vb-splash-seen");
  }

  return (
    <div
      className="vb-splash fixed inset-0 z-[100] flex items-center justify-center bg-white"
      onAnimationEnd={handleAnimationEnd}
      aria-hidden="true"
    >
      <div className="vb-splash-logo flex flex-col items-center gap-4">
        <Image
          src="/logo-dummy.png"
          alt=""
          width={517}
          height={624}
          preload
          className="h-20 w-auto"
        />
        <span className="text-3xl font-semibold tracking-[0.2em] text-zinc-800">ことりずむ</span>
      </div>
    </div>
  );
}
