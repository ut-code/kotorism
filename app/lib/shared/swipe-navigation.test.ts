import { describe, expect, it } from "vite-plus/test";

import { getSwipeDestination, swipeGesture, swipeHintState } from "./swipe-navigation";

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

describe("swipeGesture", () => {
  it("横に 50px 以上動かしたらフリック（指を動かした向き）", () => {
    expect(swipeGesture(-50, 0)).toBe("left");
    expect(swipeGesture(120, 10)).toBe("right");
  });

  it("短い動きや、縦の動きが大きいときはフリックにしない", () => {
    expect(swipeGesture(49, 0)).toBeNull();
    expect(swipeGesture(60, 50)).toBeNull();
  });
});

describe("swipeHintState", () => {
  it("横に少し動かし始めたら名前を出すが、まだ移る先は決めない", () => {
    expect(swipeHintState(20, 0)).toEqual({ visible: true, target: null });
  });

  it("フリックになる距離まで動かしたら、離すと移る側を示す（指を右へ動かすと左隣）", () => {
    expect(swipeHintState(80, 0)).toEqual({ visible: true, target: "left" });
    expect(swipeHintState(-80, 0)).toEqual({ visible: true, target: "right" });
  });

  it("ほとんど動いていないときや縦スクロール中は出さない", () => {
    expect(swipeHintState(5, 0)).toEqual({ visible: false, target: null });
    expect(swipeHintState(30, 40)).toEqual({ visible: false, target: null });
  });
});
