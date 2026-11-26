// スマホ・タブレットで、ログイン中に横フリックだけで行き来できる3画面。並びは
// My単語帳 ← 学習履歴 → 学習教材 で、指を左へ動かすと右隣、右へ動かすと左隣へ移り（ページをめくる向き）、
// 両端はループしてつながる
export const SWIPE_PAGES = ["/my-notebooks", "/history", "/learn"] as const;

// 横に指を動かしている間、画面の左右の端に出す隣のページの名前（SwipePageNavigator）
export const SWIPE_PAGE_LABELS: Record<(typeof SWIPE_PAGES)[number], string> = {
  "/my-notebooks": "My単語帳",
  "/history": "学習履歴",
  "/learn": "学習教材",
};

// 横フリックとみなす指の移動距離（px）。これ未満の移動はタップ扱いにして、クリック操作を妨げない
export const SWIPE_DISTANCE = 50;
// 隣のページの名前を出し始める指の移動距離（px）。縦スクロールの小さな横ぶれでは出さない
const HINT_DISTANCE = 12;

// 縦スクロールとの誤判定を避けるため、横移動が縦移動の1.5倍を超えたときだけ横の動きとみなす
function isHorizontal(dx: number, dy: number): boolean {
  return Math.abs(dx) > Math.abs(dy) * 1.5;
}

// 指を離したときにフリックとみなすか。左へ動かしたら "left"、右へ動かしたら "right"
export function swipeGesture(dx: number, dy: number): "left" | "right" | null {
  if (Math.abs(dx) < SWIPE_DISTANCE || !isHorizontal(dx, dy)) return null;
  return dx < 0 ? "left" : "right";
}

// 指を動かしている途中の、隣のページの名前の出し方。
// visible: 横に動かし始めたら出す。target: 今離すと移るページの側（指を右へ動かすと左隣、左へ動かすと右隣）
export function swipeHintState(
  dx: number,
  dy: number,
): { visible: boolean; target: SwipeDirection | null } {
  if (Math.abs(dx) < HINT_DISTANCE || !isHorizontal(dx, dy))
    return { visible: false, target: null };
  const gesture = swipeGesture(dx, dy);
  return {
    visible: true,
    target: gesture === null ? null : gesture === "right" ? "left" : "right",
  };
}

export type SwipeDirection = "left" | "right";

// 今のページの右隣・左隣のページ。3画面以外のページではnull（フリックで移動しない）
export function getSwipeDestination(pathname: string, direction: SwipeDirection): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const index = SWIPE_PAGES.findIndex((page) => page === normalized);
  if (index === -1) return null;
  const step = direction === "right" ? 1 : -1;
  return SWIPE_PAGES[(index + step + SWIPE_PAGES.length) % SWIPE_PAGES.length];
}
