import { describe, expect, it } from "vitest";

import { getPageSwitcherDestination, getSwipeDestination } from "./swipe-navigation";

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

describe("getPageSwitcherDestination", () => {
  it("3画面では、フリックと同じ隣のページを返す", () => {
    expect(getPageSwitcherDestination("/history", "right")).toBe("/learn");
    expect(getPageSwitcherDestination("/learn", "right")).toBe("/my-notebooks");
  });

  it("学習教材・My単語帳の下の階層では、その上の画面と同じ隣のページを返す", () => {
    expect(getPageSwitcherDestination("/learn/french", "left")).toBe("/history");
    expect(getPageSwitcherDestination("/learn/french/french-01", "right")).toBe("/my-notebooks");
    expect(getPageSwitcherDestination("/my-notebooks/abc/study", "right")).toBe("/history");
  });

  it("名前が似ているだけの別のページや、3画面と関係ないページでは隣のページが無い", () => {
    expect(getPageSwitcherDestination("/learning", "right")).toBeNull();
    expect(getPageSwitcherDestination("/share/abc", "right")).toBeNull();
    expect(getPageSwitcherDestination("/", "right")).toBeNull();
  });
});
