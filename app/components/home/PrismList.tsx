import { useId } from "react";

// 罫線と光の跡の色。光の跡は左上の --vb-trail-from から右下の --vb-trail-to（罫線と同じ色）へのグラデーション
const TONES = {
  coral: {
    rule: "decoration-coral-200 dark:decoration-coral-900",
    trail:
      "[--vb-trail-from:var(--color-coral-400)] [--vb-trail-to:var(--color-coral-200)] dark:[--vb-trail-from:var(--color-coral-600)] dark:[--vb-trail-to:var(--color-coral-900)]",
  },
  tealblue: {
    rule: "decoration-tealblue-200 dark:decoration-tealblue-900",
    trail:
      "[--vb-trail-from:var(--color-tealblue-400)] [--vb-trail-to:var(--color-tealblue-200)] dark:[--vb-trail-from:var(--color-tealblue-600)] dark:[--vb-trail-to:var(--color-tealblue-900)]",
  },
};

type Tone = keyof typeof TONES;

type PrismListProps = {
  items: string[];
  tone: Tone;
  // 罫線を文字の下端（ディセンダーの下）からどれだけ下に引くか（px）。光の跡の最後の粒もここにそろえる
  ruleOffset: number;
  // 各行の頭に光の跡を置くか。false にすると罫線を引いた文章だけを並べる
  marker?: boolean;
  // 一覧全体の文字の大きさ・行の高さ・色
  className?: string;
};

// 罫線（text-underline-position: under）は文字の下端を基準に引かれる。Noto Sans JP の下端はベースラインの 0.288em 下
const FONT_DESCENT = "0.288em";

// 光の跡の viewBox。preserveAspectRatio="none" で引き伸ばすため、表示（幅1em × 文字の上端から罫線まで）の縦横比に近くして粒が潰れないようにする
const TRAIL_WIDTH = 12;
const TRAIL_HEIGHT = 21;

// 光の跡の1粒。sparkle は4つの尖りを持つきらめき、それ以外は丸い粒
type Speck = { x: number; y: number; r: number; opacity: number; sparkle?: boolean };

// 行ごとに順に使う粒の並び。どの並びも最後の粒は罫線の始まり（右下の角）に置く
const TRAIL_PATTERNS: Speck[][] = [
  [
    { x: 3.2, y: 4.5, r: 2.8, opacity: 1, sparkle: true },
    { x: 7.4, y: 2.2, r: 0.7, opacity: 0.7 },
    { x: 1.4, y: 10.5, r: 0.6, opacity: 0.6 },
    { x: 6.6, y: 10, r: 1, opacity: 0.85 },
    { x: 9.6, y: 15, r: 0.7, opacity: 0.75 },
    { x: 4.8, y: 16.5, r: 0.45, opacity: 0.5 },
    { x: 11.3, y: 20.4, r: 0.6, opacity: 0.9 },
  ],
  [
    { x: 4.6, y: 3.6, r: 2.4, opacity: 1, sparkle: true },
    { x: 1.2, y: 7.4, r: 0.55, opacity: 0.6 },
    { x: 8.8, y: 7.8, r: 0.8, opacity: 0.8 },
    { x: 5.4, y: 12.6, r: 0.6, opacity: 0.65 },
    { x: 8.2, y: 17.2, r: 1.5, opacity: 0.85, sparkle: true },
    { x: 3.6, y: 19, r: 0.4, opacity: 0.45 },
    { x: 11.3, y: 20.4, r: 0.6, opacity: 0.9 },
  ],
  [
    { x: 2.8, y: 6, r: 2.6, opacity: 1, sparkle: true },
    { x: 6.6, y: 1.8, r: 0.5, opacity: 0.55 },
    { x: 7.6, y: 7.4, r: 0.9, opacity: 0.8 },
    { x: 3.4, y: 13.4, r: 0.5, opacity: 0.55 },
    { x: 10.2, y: 11.8, r: 0.55, opacity: 0.65 },
    { x: 7.8, y: 15.6, r: 0.75, opacity: 0.75 },
    { x: 11.3, y: 20.4, r: 0.6, opacity: 0.9 },
  ],
];

// 4つの尖りを持つきらめきの形
function sparklePath({ x, y, r }: Speck) {
  return `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
}

// 箇条書きの点の代わりに置く、小さく散らばった光の跡
function LightTrail({
  tone,
  ruleOffset,
  index,
}: {
  tone: Tone;
  ruleOffset: number;
  index: number;
}) {
  // url(#...) で参照するため、useId の記号を取り除いて id に使える文字だけにする
  const gradientId = `light-trail-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const specks = TRAIL_PATTERNS[index % TRAIL_PATTERNS.length];
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${TRAIL_WIDTH} ${TRAIL_HEIGHT}`}
      preserveAspectRatio="none"
      // 行の並びはベースラインでそろうため、下の余白を負にして罫線の高さ（線の太さ1pxの真ん中）まで下へ伸ばす
      style={{
        marginBottom: `calc(-1 * (${FONT_DESCENT} + ${ruleOffset + 0.5}px))`,
        height: `calc(1em + ${FONT_DESCENT} + ${ruleOffset + 0.5}px)`,
      }}
      className={`w-[1em] flex-none ${TONES[tone].trail}`}
    >
      <defs>
        {/* 粒ごとではなく全体に1つのグラデーション（userSpaceOnUse）をかけ、置いた位置で色が決まるようにする */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={TRAIL_WIDTH}
          y2={TRAIL_HEIGHT}
        >
          <stop offset="0" style={{ stopColor: "var(--vb-trail-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--vb-trail-to)" }} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        {specks.map((speck) =>
          speck.sparkle ? (
            <path key={`${speck.x}-${speck.y}`} d={sparklePath(speck)} opacity={speck.opacity} />
          ) : (
            <circle
              key={`${speck.x}-${speck.y}`}
              cx={speck.x}
              cy={speck.y}
              r={speck.r}
              opacity={speck.opacity}
            />
          ),
        )}
      </g>
    </svg>
  );
}

// トップページの本のページに並べる一覧。各行の文章に罫線（下線）を引き、折り返した行も含めて文章の長さに合わせる。
// marker が true なら、行頭に光の跡を置く
export function PrismList({
  items,
  tone,
  ruleOffset,
  marker = true,
  className = "",
}: PrismListProps) {
  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={item} className="flex items-baseline">
          {marker && <LightTrail tone={tone} ruleOffset={ruleOffset} index={index} />}
          <span
            style={{ textUnderlineOffset: ruleOffset }}
            className={`underline decoration-1 [text-decoration-skip-ink:none] [text-underline-position:under] ${TONES[tone].rule}`}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
