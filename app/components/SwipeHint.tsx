import { useLocation } from "react-router";

import Link from "@/components/Link";
import {
  SWIPE_PAGE_LABELS,
  getSwipeDestination,
  getPageSwitcherDestination,
  type SwipeDirection,
} from "@/lib/shared/swipe-navigation";

// ヘッダーの下、画面の左右の端に「◀ 左隣のページ」「右隣のページ ▶」を出す（My単語帳 ← 学習履歴 → 学習教材 の並び）。
// 指を右へ動かすと左隣のページが左から、左へ動かすと右隣のページが右から入ってくる。
// スマホ・タブレットではフリック操作を促し、どの画面幅でもタップ・クリックで移動できる。
// 学習教材・My単語帳の下の階層（/learn/french など）にも出し、3ページとそれらの下の階層以外では何も出さない
export default function SwipeHint() {
  const { pathname } = useLocation();
  const destination = (direction: SwipeDirection) => {
    const href = getPageSwitcherDestination(pathname, direction);
    return href ? { href, label: SWIPE_PAGE_LABELS[href as keyof typeof SWIPE_PAGE_LABELS] } : null;
  };
  const onLeftEdge = destination("left");
  const onRightEdge = destination("right");
  if (!onLeftEdge || !onRightEdge) return null;

  const linkClass =
    "flex items-center gap-1 px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 active:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:active:text-zinc-50";
  return (
    <nav
      aria-label="ページの切り替え"
      className="vb-swipe-hint flex w-full items-center justify-between px-1"
    >
      <Link href={onLeftEdge.href} className={linkClass}>
        <span aria-hidden="true">◀︎</span>
        {onLeftEdge.label}
      </Link>
      <Link href={onRightEdge.href} className={linkClass}>
        {onRightEdge.label}
        <span aria-hidden="true">▶︎</span>
      </Link>
    </nav>
  );
}
