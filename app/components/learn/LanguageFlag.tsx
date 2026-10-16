import { useId } from "react";

// 学習教材の言語一覧（/learn）で使う、国旗をモチーフにした旗。
// 言語と国は一対一ではない（スペイン語・フランス語は多くの国で話される）ため、国旗そのものではなく
// 配色と模様をなぞった意匠として、はためく布のような形に描く

// 5つの頂点を持つ星の座標
function starPoints(cx: number, cy: number, r: number, rotate = 0): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const angle = ((i * 36 + rotate - 90) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

// 旗の柄（viewBox 0 0 60 40 いっぱいに描く）
const PATTERNS: Record<string, () => React.ReactNode> = {
  chinese: () => (
    <>
      <rect width="60" height="40" fill="#EE1C25" />
      <polygon points={starPoints(11, 11, 6)} fill="#FFDE00" />
      {[
        [21, 5, 23],
        [25, 9, 45],
        [25, 15, 0],
        [21, 19, 23],
      ].map(([cx, cy, rotate]) => (
        <polygon key={`${cx}-${cy}`} points={starPoints(cx, cy, 2, rotate)} fill="#FFDE00" />
      ))}
    </>
  ),
  french: () => (
    <>
      <rect width="20" height="40" fill="#0055A4" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#EF4135" />
    </>
  ),
  german: () => (
    <>
      <rect width="60" height="13.4" fill="#000000" />
      <rect y="13.3" width="60" height="13.4" fill="#DD0000" />
      <rect y="26.6" width="60" height="13.4" fill="#FFCE00" />
    </>
  ),
  spanish: () => (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  ),
};

// 上下の辺をゆるく波打たせた、はためく布の輪郭
const WAVE_PATH =
  "M2 6 C 14 1, 26 1, 38 5 S 54 8, 58 4 L 58 34 C 54 38, 46 37, 38 35 S 14 31, 2 36 Z";

export default function LanguageFlag({
  languageSlug,
  className,
}: {
  languageSlug: string;
  className?: string;
}) {
  const id = useId();
  const pattern = PATTERNS[languageSlug];
  if (!pattern) return null;

  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={WAVE_PATH} />
        </clipPath>
        {/* 布のたわみに沿った陰影。明るい山と暗い谷を交互に重ねる */}
        <linearGradient id={`${id}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.08" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {pattern()}
        <rect width="60" height="40" fill={`url(#${id}-shade)`} />
      </g>
      {/* 白地が背景に溶けないよう、ごく薄い輪郭線を引く */}
      <path d={WAVE_PATH} fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="0.6" />
    </svg>
  );
}
