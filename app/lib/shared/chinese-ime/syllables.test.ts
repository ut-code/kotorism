import { describe, expect, it } from "vite-plus/test";

import { isPinyinSyllable, normalizeSyllable, segmentPinyin } from "./syllables";

const texts = (input: string) => segmentPinyin(input)?.map((s) => s.text);

describe("isPinyinSyllable", () => {
  it("声調なしの音節を見分ける（ü は v で書く）", () => {
    for (const s of ["a", "zhong", "guo", "nv", "lve", "er", "shuang"]) {
      expect(isPinyinSyllable(s), s).toBe(true);
    }
    for (const s of ["zhon", "nu e", "bv", "x", "ga g", ""]) {
      expect(isPinyinSyllable(s), s).toBe(false);
    }
  });
});

describe("normalizeSyllable", () => {
  it("声調番号・声調記号を取り、小文字にして ü を v にする", () => {
    expect(normalizeSyllable("Zhong1")).toBe("zhong");
    expect(normalizeSyllable("nü3")).toBe("nv");
    expect(normalizeSyllable("lǜ")).toBe("lv");
    expect(normalizeSyllable("hǎo")).toBe("hao");
  });

  it("lue・nue は lve・nve とみなす", () => {
    expect(normalizeSyllable("lue4")).toBe("lve");
    expect(normalizeSyllable("nüe4")).toBe("nve");
  });
});

describe("segmentPinyin", () => {
  it("続けて打ったピンインを音節に区切る", () => {
    expect(texts("nihao")).toEqual(["ni", "hao"]);
    expect(texts("zhongguo")).toEqual(["zhong", "guo"]);
    expect(texts("women")).toEqual(["wo", "men"]);
  });

  it("前から長い音節を優先し、残りが区切れないときは短い音節に戻る", () => {
    expect(texts("xian")).toEqual(["xian"]);
    expect(texts("fangan")).toEqual(["fang", "an"]);
    expect(texts("kean")).toEqual(["ke", "an"]);
  });

  it("アポストロフィで区切りを指定できる", () => {
    expect(texts("xi'an")).toEqual(["xi", "an"]);
  });

  it("最後の音節は打ちかけでもよい（partial になる）", () => {
    expect(segmentPinyin("zhongg")).toEqual([
      { text: "zhong", start: 0, end: 5, partial: false },
      { text: "g", start: 5, end: 6, partial: true },
    ]);
    expect(segmentPinyin("zho")).toEqual([{ text: "zho", start: 0, end: 3, partial: true }]);
  });

  it("位置（start・end）はアポストロフィを含めた入力の文字位置", () => {
    expect(segmentPinyin("xi'an")).toEqual([
      { text: "xi", start: 0, end: 2, partial: false },
      { text: "an", start: 3, end: 5, partial: false },
    ]);
  });

  it("ピンインとして区切れない入力は null", () => {
    expect(segmentPinyin("zhonguo")).toBeNull();
    expect(segmentPinyin("bv")).toBeNull();
    expect(segmentPinyin("")).toBeNull();
    expect(segmentPinyin("'")).toBeNull();
  });
});
