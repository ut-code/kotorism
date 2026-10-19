import { describe, expect, it } from "vitest";

import { getSwipeDestination } from "./swipe-navigation";

describe("getSwipeDestination", () => {
  it("学習履歴の右隣は学習教材、左隣はMy単語帳", () => {
    expect(getSwipeDestination("/history", "right")).toBe("/learn");
    expect(getSwipeDestination("/history", "left")).toBe("/my-notebooks");
  });

  it("学習教材とMy単語帳の間はループしてつながる", () => {
    expect(getSwipeDestination("/learn", "right")).toBe("/my-notebooks");
    expect(getSwipeDestination("/learn", "left")).toBe("/history");
    expect(getSwipeDestination("/my-notebooks", "right")).toBe("/history");
    expect(getSwipeDestination("/my-notebooks", "left")).toBe("/learn");
  });

  it("末尾のスラッシュがあっても同じページとみなす", () => {
    expect(getSwipeDestination("/history/", "right")).toBe("/learn");
  });

  it("3画面以外（各単語帳や教材の中のページなど）には隣のページが無い", () => {
    expect(getSwipeDestination("/", "right")).toBeNull();
    expect(getSwipeDestination("/my-notebooks/abc", "right")).toBeNull();
    expect(getSwipeDestination("/learn/french", "left")).toBeNull();
  });
});
