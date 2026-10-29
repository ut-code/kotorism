// components/WaveCirclesBackground.tsx の白い円の位置・大きさと、縁から中心へ白く抜けていく濃さを求める
export type WaveCirclesShape = {
  // 円の半径を、中身の高さの半分からどれだけ大きくするか（px）
  base: number;
  // 縁から内側へ、色が消えるまでの幅（px）
  band: number;
  // 縁と、縁より外の背景の色の不透明度
  strength: number;
  // 背景の下端から上へ、透明にしていく幅（px）
  bottomFade: number;
};

// md以上の画面幅
export const WAVE_CIRCLES_SHAPE: WaveCirclesShape = {
  base: 200,
  band: 260,
  strength: 0.55,
  bottomFade: 280,
};

// md未満の画面幅
export const WAVE_CIRCLES_SHAPE_NARROW: WaveCirclesShape = {
  base: 120,
  band: 220,
  strength: 0.575,
  bottomFade: 188,
};

export type WaveCirclesFrame = {
  // 中身の範囲（背景を敷く親要素の左上を原点とする）
  contentCenterX: number;
  contentCenterY: number;
  contentHeight: number;
};

// 放射状グラデーションの stop。offset は中心からの距離の半径に対する割合
export type WaveCircleStop = { offset: number; opacity: number };

export type WaveCircle = { cx: number; cy: number; r: number; stops: WaveCircleStop[] };

// 縁から色が消えるまでの帯を、いくつの stop で表すか
const STEPS = 8;

export function waveCircle(frame: WaveCirclesFrame, shape: WaveCirclesShape): WaveCircle {
  const r = frame.contentHeight / 2 + shape.base;
  const fadeFrom = Math.max(0, r - shape.band) / r;
  const stops = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    return { offset: fadeFrom + (1 - fadeFrom) * t, opacity: shape.strength * t ** 2 };
  });
  return { cx: frame.contentCenterX, cy: frame.contentCenterY, r, stops };
}
