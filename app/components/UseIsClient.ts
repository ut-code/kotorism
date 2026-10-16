import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// サーバーでの描画とハイドレーション中は false、ブラウザで表示が確定したあとは true を返す。
// 乱数や window.location のように、サーバーとブラウザで値が変わるものを描画に使うときに、
// ハイドレーションの不一致（Hydration failed）を起こさないための切り替えに使う
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
