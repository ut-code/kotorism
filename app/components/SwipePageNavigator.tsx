import { useLocation, useNavigate } from "react-router";

import { useSwipe } from "@/hooks/useSwipe";
import { getSwipeDestination, type SwipeDirection } from "@/lib/shared/swipe-navigation";

// ページを切り替えるアニメーション（View Transition）が始まらないとき（動きを減らす設定・非対応のブラウザなど）に、
// 始まるのを待つフレーム数
const TRANSITION_START_FRAMES = 10;
// 何かあっても、スライドの向きの印をいつまでも残さないための上限（ミリ秒）
const TRANSITION_TIMEOUT_MS = 3000;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// 動いている View Transition のアニメーション（::view-transition-* の疑似要素のもの）
function viewTransitionAnimations() {
  return document.documentElement
    .getAnimations({ subtree: true })
    .filter((animation) =>
      ((animation.effect as KeyframeEffect | null)?.pseudoElement ?? "").startsWith(
        "::view-transition",
      ),
    );
}

// ページを切り替えるアニメーションが実際に終わるまで待つ。遅い端末では決め打ちの時間では終わらないことがあり、
// 途中で印を外すとスライドがただの切り替えに変わってしまうため、動いているアニメーションを見て待つ
async function waitForViewTransition() {
  const deadline = performance.now() + TRANSITION_TIMEOUT_MS;
  let started = false;
  let idleFrames = 0;
  while (performance.now() < deadline) {
    await nextFrame();
    const running = viewTransitionAnimations();
    if (running.length > 0) {
      started = true;
      await Promise.allSettled(running.map((animation) => animation.finished));
    } else if (started || ++idleFrames > TRANSITION_START_FRAMES) {
      return;
    }
  }
}

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
    void Promise.resolve(navigate(destination, { viewTransition: true }))
      .then(waitForViewTransition)
      .finally(() => delete root.dataset.swipe);
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
