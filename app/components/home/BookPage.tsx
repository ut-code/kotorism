import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { BOOK_PAGE_SHAPE, bookPagePath } from "@/lib/shared/book-page";

type BookPageProps = {
  // left: My単語帳（コーラル）、right: 学習教材（ティールブルー）
  side: "left" | "right";
  className?: string;
  children: ReactNode;
};

// ページの中は白（ダークモードでは zinc-950）で塗り、枠線だけをそれぞれの色にする
const COLORS = {
  left: {
    border: "border-coral-300 dark:border-coral-800",
    stroke: "stroke-coral-300 dark:stroke-coral-800",
    padding: "md:pl-10 md:pr-9",
  },
  right: {
    border: "border-tealblue-300 dark:border-tealblue-700",
    stroke: "stroke-tealblue-300 dark:stroke-tealblue-700",
    padding: "md:pl-9 md:pr-10",
  },
};

// サーバーで描くときはまだ大きさが分からないため、この大きさで描いて縦横に引き伸ばしておき、
// 表示後に実際の大きさで描き直す（背景が一瞬消えないように）
const INITIAL_SIZE = { width: 480, height: 640 };

// トップページの紹介カード。2枚が横に並ぶ幅（md以上）では、本の左右のページに見立てた形で描き、
// 縦に積む幅では角の丸いカードにする
export default function BookPage({ side, className = "", children }: BookPageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(INITIAL_SIZE);
  const colors = COLORS[side];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  return (
    <div
      ref={ref}
      style={
        {
          "--book-pt": `${BOOK_PAGE_SHAPE.dipTop + 12}px`,
          "--book-pb": `${BOOK_PAGE_SHAPE.dipBottom + 32}px`,
        } as CSSProperties
      }
      className={`relative isolate rounded-3xl border bg-white p-8 text-left sm:p-9 md:rounded-none md:border-0 md:bg-transparent md:pt-(--book-pt) md:pb-(--book-pb) dark:bg-zinc-950 md:dark:bg-transparent ${colors.border} ${colors.padding} ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -z-10 hidden size-full overflow-visible md:block"
      >
        <path
          d={bookPagePath(width, height, BOOK_PAGE_SHAPE)}
          transform={side === "right" ? `translate(${width},0) scale(-1,1)` : undefined}
          strokeWidth={1}
          // 表示前の仮の大きさで引き伸ばしているあいだも、線の太さを変えない
          vectorEffect="non-scaling-stroke"
          className={`fill-white dark:fill-zinc-950 ${colors.stroke}`}
        />
      </svg>
      {children}
    </div>
  );
}
