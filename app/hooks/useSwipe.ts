import { useRef } from "react";

import { swipeGesture } from "@/lib/shared/swipe-navigation";

// 要素に付けるタッチハンドラを返す。左スワイプで onSwipeLeft、右スワイプで onSwipeRight を呼ぶ。
// 短い動き（タップ）や縦スクロールはスワイプとみなさない（判定は lib/shared/swipe-navigation.ts の swipeGesture）。
// onMove: 指を動かしている間、触れ始めた位置からの移動量を渡す。onEnd: 指を離した・中断したときに呼ぶ
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onMove,
  onEnd,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!start.current || !onMove) return;
      const touch = e.touches[0];
      onMove(touch.clientX - start.current.x, touch.clientY - start.current.y);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const touch = e.changedTouches[0];
      const gesture = swipeGesture(
        touch.clientX - start.current.x,
        touch.clientY - start.current.y,
      );
      start.current = null;
      onEnd?.();
      if (gesture === "left") onSwipeLeft();
      else if (gesture === "right") onSwipeRight();
    },
    onTouchCancel: () => {
      start.current = null;
      onEnd?.();
    },
  };
}
