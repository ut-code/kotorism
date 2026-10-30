import { describe, expect, it } from "vite-plus/test";

import { insertionIndex, moveToInsertionPoint } from "./reorder";

describe("insertionIndex", () => {
  // 3つの項目の中心が 10, 30, 50 の位置にあるとき、指（マウス）の位置からどの間に入れるかを決める
  const centers = [10, 30, 50];

  it("項目の中心より手前なら、その項目の前に入れる", () => {
    expect(insertionIndex(centers, 0)).toBe(0);
    expect(insertionIndex(centers, 25)).toBe(1);
    expect(insertionIndex(centers, 45)).toBe(2);
  });

  it("すべての中心より後ろなら、いちばん後ろに入れる", () => {
    expect(insertionIndex(centers, 60)).toBe(3);
  });
});

describe("moveToInsertionPoint", () => {
  const items = ["a", "b", "c", "d"];

  it("前から後ろへ動かす（入れる位置は、動かす前の並びでの間の番号）", () => {
    expect(moveToInsertionPoint(items, 0, 3)).toEqual(["b", "c", "a", "d"]);
    expect(moveToInsertionPoint(items, 0, 4)).toEqual(["b", "c", "d", "a"]);
  });

  it("後ろから前へ動かす", () => {
    expect(moveToInsertionPoint(items, 3, 1)).toEqual(["a", "d", "b", "c"]);
    expect(moveToInsertionPoint(items, 2, 0)).toEqual(["c", "a", "b", "d"]);
  });

  it("自分の前後の間に入れるときは、並びが変わらない", () => {
    expect(moveToInsertionPoint(items, 1, 1)).toEqual(items);
    expect(moveToInsertionPoint(items, 1, 2)).toEqual(items);
  });

  it("元の配列は書き換えない", () => {
    const original = [...items];
    moveToInsertionPoint(items, 0, 4);
    expect(items).toEqual(original);
  });
});
