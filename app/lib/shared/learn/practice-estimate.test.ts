import { describe, expect, it } from "vite-plus/test";

import { estimateMinutes, practiceEstimateLabel } from "./practice-estimate";

describe("estimateMinutes", () => {
  it("入力式は選択式より長く見積もる", () => {
    expect(estimateMinutes(10, "choice")).toBe(2);
    expect(estimateMinutes(10, "typing")).toBe(3);
  });

  it("問題が少なくても「約0分」にはしない", () => {
    expect(estimateMinutes(1, "choice")).toBe(1);
  });
});

describe("practiceEstimateLabel", () => {
  it("初期値の問題数と目安の分数を書く", () => {
    expect(practiceEstimateLabel("choice")).toBe("10問・約2分");
  });
});
