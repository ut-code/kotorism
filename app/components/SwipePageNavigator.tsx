import { useLocation, useNavigate } from "react-router";

import { useSwipe } from "@/hooks/useSwipe";
import { getSwipeDestination, type SwipeDirection } from "@/lib/shared/swipe-navigation";

// globals.css のスライドアニメーションの長さと合わせる
const SWIPE_ANIMATION_MS = 300;

// 横スクロールできる要素（学習カレンダーなど）の中で始まったタッチか。そこでの横移動はスクロールに使うため、ページ移動にしない
function startsInHorizontalScroller(target: EventTarget, container: Element) {
  for (let el = target as Element | null; el && el !== container; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) {
      return true;
    }
  }
  return false;
}

// スマホ・タブレットで、My単語帳・学習履歴・学習教材の3画面を横フリックで行き来できるようにする領域。
// タッチイベントはタッチ操作のできる端末でしか起きないため、PCのマウス操作には影響しない
export default function SwipePageNavigator({
  enabled,
  children,
}: {
  // ログイン中だけtrue
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const go = (direction: SwipeDirection) => {
    const destination = getSwipeDestination(pathname, direction);
    if (!destination) return;
    // どちらの隣へ移るかを CSS（globals.css の vb-swipe-*）に伝えてスライドの向きを決め、アニメーションが終わったら外す
    const root = document.documentElement;
    root.dataset.swipe = direction;
    void Promise.resolve(navigate(destination, { viewTransition: true })).finally(() => {
      window.setTimeout(() => delete root.dataset.swipe, SWIPE_ANIMATION_MS + 200);
    });
  };
  const swipeHandlers = useSwipe({
    // 指を左へ動かすと右隣、右へ動かすと左隣のページへ（ページを指でめくる向き）
    onSwipeLeft: () => go("right"),
    onSwipeRight: () => go("left"),
  });

  if (!enabled || !getSwipeDestination(pathname, "right")) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }
  return (
    // 横方向の指の動きはブラウザに任せずこちらで受け取る（暗記カードの StudyDeck と同じ）。拡大縮小はそのまま使える
    <div
      className="vb-swipe-page flex flex-1 touch-pan-y touch-pinch-zoom flex-col"
      {...swipeHandlers}
      onTouchStart={(e) => {
        if (startsInHorizontalScroller(e.target, e.currentTarget)) return;
        swipeHandlers.onTouchStart(e);
      }}
    >
      {children}
    </div>
  );
}
