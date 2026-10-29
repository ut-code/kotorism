import { describe, expect, it } from "vitest";

import { BOOK_PAGE_SHAPE, bookPagePath } from "./book-page";

const SHAPE = {
  dipTop: 72,
  topBend: 0.41,
  topRound: 1,
  dipBottom: 40,
  bottomBend: 0,
  radius: 12,
};

describe("bookPagePath", () => {
  it("外側の上の角から始まり、閉じた輪郭になる", () => {
    const d = bookPagePath(500, 600, SHAPE);
    expect(d.startsWith("M0,12 Q0,0 12,0")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });

  it("のど側の上端は外側より dipTop だけ下がり、のど側の下端はページの下端にある", () => {
    const d = bookPagePath(500, 600, SHAPE);
    // 上の辺: 曲がり始め(幅の41%)から、のど(x=500)で縦になって y=72 に着く
    expect(d).toContain("C205,0 500,0 500,72");
    // のどの辺はページの下端の手前(角の丸みの分)まで下り、丸い角を回る
    expect(d).toContain("V588 Q500,600 488,600");
  });

  it("外側の下端はページの下端より dipBottom だけ上にある", () => {
    const d = bookPagePath(500, 600, SHAPE);
    expect(d).toContain("0,560 12,560");
    expect(d).toContain("Q0,560 0,548");
  });

  it("ページが小さくても、角の丸みが辺からはみ出さない", () => {
    const d = bookPagePath(40, 600, { ...SHAPE, radius: 30 });
    expect(d.startsWith("M0,10 Q0,0 10,0")).toBe(true);
  });

  it("トップページで使う形は、モックで決めた値になっている", () => {
    expect(BOOK_PAGE_SHAPE).toEqual(SHAPE);
  });
});
