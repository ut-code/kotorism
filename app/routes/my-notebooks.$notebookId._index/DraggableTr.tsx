import type { ComponentProps } from "react";

import { useLongPressDrag, type LongPressDragHandlers } from "@/hooks/useLongPressDrag";

// 長押ししたまま動かして並べ替えられる表の行。1つの単語に組が複数あると <tr> も複数になるため、
// 行ごとにこの部品を使い、どの行を長押ししても同じ単語を動かせるようにする。
// 長押ししている単語の行には、すべて data-card-pressed を付けて色を付ける（CardRow）
export default function DraggableTr({
  drag,
  dragDisabled = false,
  className = "",
  ...props
}: ComponentProps<"tr"> & { drag?: LongPressDragHandlers; dragDisabled?: boolean }) {
  const ref = useLongPressDrag(drag ?? {}, dragDisabled || !drag);
  return (
    <tr
      ref={ref}
      // 長押しになったら色を付けて伝える。スマホでは長押しで文字の選択・メニューが出ないようにする
      className={`data-[card-pressed]:bg-coral-50 data-[long-pressed]:bg-coral-50 dark:data-[card-pressed]:bg-coral-950/30 dark:data-[long-pressed]:bg-coral-950/30 pointer-coarse:select-none [-webkit-touch-callout:none] ${className}`}
      {...props}
    />
  );
}
