// スマホ・タブレットで、ログイン中に横フリックだけで行き来できる3画面。並びは
// My単語帳 ← 学習履歴 → 学習教材 で、指を左へ動かすと右隣、右へ動かすと左隣へ移り（ページをめくる向き）、
// 両端はループしてつながる
export const SWIPE_PAGES = ["/my-notebooks", "/history", "/learn"] as const;

// ヘッダーの下に出す、左右に移れるページの表示（SwipeHint）に使う名前
export const SWIPE_PAGE_LABELS: Record<(typeof SWIPE_PAGES)[number], string> = {
  "/my-notebooks": "My単語帳",
  "/history": "最近の学習履歴",
  "/learn": "学習教材",
};

export type SwipeDirection = "left" | "right";

// 今のページの右隣・左隣のページ。3画面以外のページではnull（フリックで移動しない）
export function getSwipeDestination(pathname: string, direction: SwipeDirection): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const index = SWIPE_PAGES.findIndex((page) => page === normalized);
  if (index === -1) return null;
  const step = direction === "right" ? 1 : -1;
  return SWIPE_PAGES[(index + step + SWIPE_PAGES.length) % SWIPE_PAGES.length];
}

// ヘッダーの下の ◀▶（SwipeHint）の行き先。3画面に加えて、学習教材・My単語帳の下の階層（/learn/french など）でも、
// その上の画面と同じ隣のページを返す。フリックは下の階層の操作（暗記カードなど）とぶつかるため getSwipeDestination のまま3画面だけ
export function getPageSwitcherDestination(
  pathname: string,
  direction: SwipeDirection,
): string | null {
  const parent = SWIPE_PAGES.find((page) => pathname.startsWith(`${page}/`));
  return getSwipeDestination(parent ?? pathname, direction);
}
