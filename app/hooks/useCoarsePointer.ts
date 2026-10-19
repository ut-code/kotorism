import { useSyncExternalStore } from "react";

// 指で操作する端末（スマホ・タブレット）かどうか。サーバー側では false（マウス操作として描画する）
const QUERY = "(pointer: coarse)";

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
