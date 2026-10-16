import { useSyncExternalStore } from "react";

import {
  DEFAULT_STAR_COLORS,
  loadStarColors,
  saveStarColors,
  type StarColorLevel,
  type StarColors,
} from "@/lib/shared/star-colors";

// ★の色設定を、Reactツリー全体で共有するモジュールスコープの状態として管理する
// （Contextでラップせずに済むよう、useSyncExternalStoreで購読させる）
let colors: StarColors = DEFAULT_STAR_COLORS;
let hydrated = false;
const listeners = new Set<() => void>();

// 初回読み取り時にだけlocalStorageから読み込む
// サーバー側（window未定義）では常にDEFAULT_STAR_COLORSのまま＝ハイドレーション不一致を起こさない
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  colors = loadStarColors();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StarColors {
  ensureHydrated();
  return colors;
}

function getServerSnapshot(): StarColors {
  return DEFAULT_STAR_COLORS;
}

function emitChange() {
  for (const listener of listeners) listener();
}

function setStarColor(level: StarColorLevel, value: string) {
  colors = { ...colors, [level]: value };
  saveStarColors(colors);
  emitChange();
}

function resetStarColors() {
  colors = DEFAULT_STAR_COLORS;
  saveStarColors(colors);
  emitChange();
}

export function useStarColors(): {
  colors: StarColors;
  setColor: (level: StarColorLevel, value: string) => void;
  resetColors: () => void;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { colors: snapshot, setColor: setStarColor, resetColors: resetStarColors };
}
