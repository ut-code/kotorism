import { type RefObject, useEffect, useId, useRef, useState } from "react";

import {
  WAVE_CIRCLES_SHAPE,
  WAVE_CIRCLES_SHAPE_NARROW,
  type WaveCirclesFrame,
  waveCircle,
} from "@/lib/shared/wave-circles";

// Tailwind の md。これより狭い画面では WAVE_CIRCLES_SHAPE_NARROW を使う
const WIDE_QUERY = "(min-width: 768px)";

// 親要素（position を持つもの）全体に敷く背景。contentRef の中心に白い円を置く（形は lib/shared/wave-circles.ts）。
// 親要素と contentRef の大きさを測ってから描くため、測り終えるまでは透明にしておく
export default function WaveCirclesBackground({
  contentRef,
}: {
  contentRef: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [frame, setFrame] = useState<WaveCirclesFrame | null>(null);
  const [wide, setWide] = useState(true);
  // url(#...) で参照するため、useId の記号を取り除いて id に使える文字だけにする
  const gradientId = `wave-circles-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const hero = ref.current?.parentElement;
    const content = contentRef.current;
    if (!hero || !content) return;
    const update = () => {
      const h = hero.getBoundingClientRect();
      const c = content.getBoundingClientRect();
      setSize({ width: h.width, height: h.height });
      setWide(window.matchMedia(WIDE_QUERY).matches);
      setFrame({
        contentCenterX: c.left - h.left + c.width / 2,
        contentCenterY: c.top - h.top + c.height / 2,
        contentHeight: c.height,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(hero);
    observer.observe(content);
    return () => observer.disconnect();
  }, [contentRef]);

  const shape = wide ? WAVE_CIRCLES_SHAPE : WAVE_CIRCLES_SHAPE_NARROW;
  const circle = frame && waveCircle(frame, shape);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox={size ? `0 0 ${size.width} ${size.height}` : undefined}
      className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-700 ${frame ? "opacity-100" : "opacity-0"}`}
    >
      {circle && size && (
        <>
          <defs>
            <linearGradient
              id={`${gradientId}-color`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              x2={size.width}
              y1={0}
              y2={0}
            >
              <stop offset="0" stopColor="#ff7c59" />
              <stop offset="0.5" stopColor="#ebbeb8" />
              <stop offset="1" stopColor="#26b6b5" />
            </linearGradient>
            {/* 色の濃さを決めるマスク。円の外は最後の stop の濃さのまま広がる（spreadMethod の既定の pad） */}
            <radialGradient
              id={`${gradientId}-fade`}
              gradientUnits="userSpaceOnUse"
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
            >
              {circle.stops.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor="white"
                  stopOpacity={stop.opacity}
                />
              ))}
            </radialGradient>
            <mask id={`${gradientId}-mask`} maskUnits="userSpaceOnUse">
              <rect width={size.width} height={size.height} fill={`url(#${gradientId}-fade)`} />
            </mask>
            <linearGradient
              id={`${gradientId}-bottom`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              x2={0}
              y1={Math.max(0, size.height - shape.bottomFade)}
              y2={size.height}
            >
              <stop offset="0" stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity={0} />
            </linearGradient>
            <mask id={`${gradientId}-bottom-mask`} maskUnits="userSpaceOnUse">
              <rect width={size.width} height={size.height} fill={`url(#${gradientId}-bottom)`} />
            </mask>
          </defs>
          {/* 下地と色をまとめて、下端の bottomFade の幅で透明にする */}
          <g mask={`url(#${gradientId}-bottom-mask)`}>
            {/* 円の中を白く見せる下地。ダークモードでは塗らない */}
            <rect
              width={size.width}
              height={size.height}
              className="fill-white dark:fill-transparent"
            />
            <rect
              width={size.width}
              height={size.height}
              fill={`url(#${gradientId}-color)`}
              mask={`url(#${gradientId}-mask)`}
            />
          </g>
        </>
      )}
    </svg>
  );
}
