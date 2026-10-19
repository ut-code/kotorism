import { useSyncExternalStore } from "react";

import { createRandomId } from "@/lib/shared/random-id";

// 手書き練習で保存した字（PNG画像）を、このブラウザの localStorage に保存する。
// 目視で見返すための記録なので、サーバーには送らない（端末・ブラウザごとの保存になる）

export type SavedHandwriting = {
  id: string;
  // 対象のペア（CharacterCompare.id）と、保存時点の字
  itemId: string;
  japanese: string;
  simplified: string;
  // 手書きの画像（data:image/png;base64,...）
  image: string;
  // 答え合わせのあとに自分で付けた判定。付ける前に保存した場合は null
  selfCheck: "ok" | "retry" | null;
  savedAt: string;
};

const STORAGE_KEY = "kotorizumu:hanzi-handwriting:v1";
// localStorage の容量（ブラウザごとに数MB）を超えないよう、新しいものからこの件数だけ残す
export const MAX_SAVED_HANDWRITINGS = 60;

// 保存一覧をモジュールスコープで持ち、useSyncExternalStore で購読させる（components/UseStarColors.ts と同じ方式）
const EMPTY: SavedHandwriting[] = [];
let items: SavedHandwriting[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

// 初回読み取り時にだけ localStorage から読み込む。サーバー側では常に空のまま＝ハイドレーション不一致を起こさない
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? (parsed as SavedHandwriting[]) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureHydrated();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

// 保存できたら true、容量不足などで保存できなければ false（そのときは一覧も変えない）
function commit(next: SavedHandwriting[]): boolean {
  const trimmed = next.slice(0, MAX_SAVED_HANDWRITINGS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    return false;
  }
  items = trimmed;
  for (const listener of listeners) listener();
  return true;
}

export function useSavedHandwritings() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items: list,
    add: (entry: Omit<SavedHandwriting, "id" | "savedAt">) =>
      commit([
        { ...entry, id: createRandomId(), savedAt: new Date().toISOString() },
        ...getSnapshot(),
      ]),
    remove: (id: string) => commit(getSnapshot().filter((entry) => entry.id !== id)),
    clear: () => commit([]),
  };
}
