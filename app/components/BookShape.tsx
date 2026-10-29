import type { CSSProperties, ReactNode } from "react";

// 1ページの縦÷横（四六判 127×188mm）
const PAGE_RATIO = 188 / 127;
// 以下の長さは viewBox の単位
const PAGE_WIDTH = 9;
const PAGE_HEIGHT = PAGE_WIDTH * PAGE_RATIO;
// のどでページの上端・下端が下がる深さ
const SPINE_DIP = 1;
const BOOK_WIDTH = PAGE_WIDTH * 2;
const BOOK_HEIGHT = PAGE_HEIGHT + SPINE_DIP;

// 左右のページを1つの図形にする（ページごとに分けると、のどにも縁の線が引かれる）
const W = PAGE_WIDTH;
const BOOK_PATH = [
  `M0.25 0L${W - 1} 0`,
  `A1 1 0 0 1 ${W} ${SPINE_DIP}A1 1 0 0 1 ${W + 1} 0`,
  `L${BOOK_WIDTH - 0.25} 0A0.25 0.25 0 0 1 ${BOOK_WIDTH} 0.25`,
  `L${BOOK_WIDTH} ${PAGE_HEIGHT - 0.25}A0.25 0.25 0 0 1 ${BOOK_WIDTH - 0.25} ${PAGE_HEIGHT}`,
  `L${W + 1} ${PAGE_HEIGHT}A1 1 0 0 0 ${W} ${BOOK_HEIGHT}A1 1 0 0 0 ${W - 1} ${PAGE_HEIGHT}`,
  `L0.25 ${PAGE_HEIGHT}A0.25 0.25 0 0 1 0 ${PAGE_HEIGHT - 0.25}`,
  "L0 0.25A0.25 0.25 0 0 1 0.25 0Z",
].join("");

// 背景をぼかす層を本の形に切り抜くためのマスク。backdrop-filter は SVG の図形にはかけられないため、HTML の層にかける
const BOOK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOOK_WIDTH} ${BOOK_HEIGHT}" preserveAspectRatio="none"><path d="${BOOK_PATH}"/></svg>`,
)}")`;

// children を載せる開いた本。md以上では本を出さず、中身を縦に並べるだけの箱になる
export default function BookShape({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={
        {
          "--book-aspect": `${BOOK_WIDTH} / ${BOOK_HEIGHT}`,
          "--book-spine": `${SPINE_DIP / BOOK_WIDTH}`,
        } as CSSProperties
      }
      // 幅は「ことりずむ」の幅（5.3 × --vb-title）+ 余白。高さは aspect-ratio で決まり、中身の方が高いときは中身に合わせて伸びる。
      // 下の padding に、のどの出っ張りの高さ（本の幅 × --book-spine）を足して、中身をページの上下中央に置く
      className={`relative flex aspect-(--book-aspect) w-[calc(5.3*var(--vb-title)+3rem)] max-w-none flex-col items-center justify-center pt-4 pb-[calc(1rem+(5.3*var(--vb-title)+3rem)*var(--book-spine))] md:aspect-auto md:w-auto md:p-0 ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 md:hidden">
        <div
          style={{
            maskImage: BOOK_MASK,
            maskSize: "100% 100%",
            WebkitMaskImage: BOOK_MASK,
            WebkitMaskSize: "100% 100%",
          }}
          className="absolute inset-0 backdrop-blur-xl"
        />
        <svg
          viewBox={`0 0 ${BOOK_WIDTH} ${BOOK_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full fill-white/30 stroke-white/70 drop-shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:fill-white/5 dark:stroke-white/15 dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          <path d={BOOK_PATH} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {children}
    </div>
  );
}
