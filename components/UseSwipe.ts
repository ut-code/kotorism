import { useRef } from "react";

// 横スワイプ判定のしきい値（px）。これ未満の移動はタップ扱いにしてフリップ等のクリック操作を妨げない
const SWIPE_DISTANCE = 50;

// 要素に付けるタッチハンドラを返す。左スワイプで onSwipeLeft、右スワイプで onSwipeRight を呼ぶ。
// 縦スクロールとの誤判定を避けるため、横移動が縦移動の1.5倍を超えたときだけスワイプとみなす
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
    onTouchCancel: () => {
      start.current = null;
    },
  };
}
