// ★を付けた回数に応じた色分けの設定
// ユーザーごとに好きな色へ編集できるよう、実際の色はlocalStorageに保存する
// このアプリはログイン機能を持たないため、「ユーザー」＝このブラウザ、という単位で扱う

export type StarColorLevel = "level1" | "level2" | "level3";

export type StarColors = Record<StarColorLevel, string>;

// デフォルト値: 信号機（1回目=緑、2回目=黄、3回目以降=赤）をイメージしつつ、
// globals.cssのブランドカラー（coral・tealblue）と彩度・明度を揃えて統一感を持たせている。
// level3はcoral-700そのものを再利用し、level1はtealblue寄りの寒色相、
// level2はcoralとlevel1の間を橋渡しする暖色のアンバーにしている
export const DEFAULT_STAR_COLORS: StarColors = {
  level1: "#3fb6b8",
  level2: "#fbbf24",
  level3: "#d6503d",
};

export const STAR_COLOR_LEVELS: StarColorLevel[] = ["level1", "level2", "level3"];

export const STAR_COLOR_LABELS: Record<StarColorLevel, string> = {
  level1: "1回目",
  level2: "2回目",
  level3: "3回目以降",
};

const STORAGE_KEY = "vocabook:starColors";

// starCount（★を付けた累計回数）に対応する色を返す
// 一度も★を付けていない（0回）場合はundefined＝色分け対象外とする
export function starColorFor(starCount: number, colors: StarColors): string | undefined {
  if (starCount <= 0) return undefined;
  if (starCount === 1) return colors.level1;
  if (starCount === 2) return colors.level2;
  return colors.level3;
}

// localStorageから読み込む。SSR中（window未定義）や壊れた保存値の場合はデフォルト値にフォールバックする
export function loadStarColors(): StarColors {
  if (typeof window === "undefined") return DEFAULT_STAR_COLORS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STAR_COLORS;
    const parsed = JSON.parse(raw) as Partial<StarColors>;
    return { ...DEFAULT_STAR_COLORS, ...parsed };
  } catch {
    return DEFAULT_STAR_COLORS;
  }
}

export function saveStarColors(colors: StarColors) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}
