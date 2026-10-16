import { describe, expect, it } from "vitest";

import { DEFAULT_STAR_COLORS, starColorFor } from "./star-colors";

describe("starColorFor", () => {
  const colors = { level1: "#111", level2: "#222", level3: "#333" };

  it("0 回以下は色分け対象外", () => {
    expect(starColorFor(0, colors)).toBeUndefined();
    expect(starColorFor(-1, colors)).toBeUndefined();
  });

  it("1 回目・2 回目・3 回目以降で色が変わる", () => {
    expect(starColorFor(1, colors)).toBe("#111");
    expect(starColorFor(2, colors)).toBe("#222");
    expect(starColorFor(3, colors)).toBe("#333");
    expect(starColorFor(99, colors)).toBe("#333");
  });
});

describe("DEFAULT_STAR_COLORS", () => {
  it("すべて 16 進カラーコードとして妥当", () => {
    for (const color of Object.values(DEFAULT_STAR_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
