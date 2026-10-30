import { describe, expect, it } from "vite-plus/test";

import { displayedStarCount } from "./star-progress";

describe("displayedStarCount", () => {
  it("押していない間は、保存済みの回数をそのまま見せる", () => {
    expect(displayedStarCount(2, null)).toBe(2);
  });

  it("保存中は、押した分を足した回数を見せる（保存済みの回数が途中までしか追いついていなくても戻らない）", () => {
    expect(displayedStarCount(0, 3)).toBe(3);
    expect(displayedStarCount(1, 3)).toBe(3);
    expect(displayedStarCount(2, 3)).toBe(3);
  });

  it("保存済みの回数が追いついたら、保存済みの回数を見せる", () => {
    expect(displayedStarCount(3, 3)).toBe(3);
    expect(displayedStarCount(4, 3)).toBe(4);
  });
});
