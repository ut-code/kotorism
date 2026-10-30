import { describe, expect, it } from "vite-plus/test";

import { WAVE_CIRCLES_SHAPE, waveCircle } from "./wave-circles";

// 見出し〜ボタンの範囲の中心が (500, 300)、高さが 400 のとき
const FRAME = { contentCenterX: 500, contentCenterY: 300, contentHeight: 400 };
const SHAPE = { ...WAVE_CIRCLES_SHAPE, base: 100, band: 150, strength: 0.6 };

describe("waveCircle", () => {
  it("範囲の中心を中心にし、半径は範囲の高さの半分 + base", () => {
    const circle = waveCircle(FRAME, SHAPE);
    expect([circle.cx, circle.cy, circle.r]).toEqual([500, 300, 300]);
  });

  it("縁から band だけ内側で透明になり、縁で strength の濃さになる", () => {
    const { stops } = waveCircle(FRAME, SHAPE);
    expect(stops.at(0)).toEqual({ offset: expect.closeTo((300 - 150) / 300), opacity: 0 });
    expect(stops.at(-1)).toEqual({ offset: 1, opacity: expect.closeTo(0.6) });
  });

  it("縁へ向かって濃くなり、縁の近くで急に濃くなる（なめらかに白へ抜ける）", () => {
    const { stops } = waveCircle(FRAME, SHAPE);
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].offset).toBeGreaterThan(stops[i - 1].offset);
      expect(stops[i].opacity).toBeGreaterThan(stops[i - 1].opacity);
    }
    // 帯のちょうど真ん中では、まだ縁の濃さの半分より薄い
    const middle = stops[Math.floor(stops.length / 2)];
    expect(middle.offset).toBeCloseTo((0.5 + 1) / 2);
    expect(middle.opacity).toBeLessThan(0.3);
  });

  it("帯が半径より太くても、透明になる位置は中心より内側にならない", () => {
    const { stops } = waveCircle(FRAME, { ...SHAPE, band: 1000 });
    expect(stops[0].offset).toBe(0);
  });
});
