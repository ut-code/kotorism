import { describe, expect, it } from "vite-plus/test";

import {
  assistModeChoices,
  assistModeFor,
  isPinyinColumn,
  normalizeNotebookLanguage,
} from "./notebook-language";

describe("normalizeNotebookLanguage", () => {
  it("学習教材にある4言語はそのまま、それ以外（英語・空・不正な値）は指定なし（null）", () => {
    for (const language of ["french", "german", "spanish", "chinese"]) {
      expect(normalizeNotebookLanguage(language)).toBe(language);
    }
    for (const value of ["english", "", null, undefined, 1, "toString"]) {
      expect(normalizeNotebookLanguage(value)).toBeNull();
    }
  });
});

describe("assistModeChoices", () => {
  it("欧州系の言語はアクセント記号の補助あり・なし、中国語は簡体字・ピンイン・なしから選ぶ", () => {
    expect(assistModeChoices("french")).toEqual(["accent", "off"]);
    expect(assistModeChoices("german")).toEqual(["accent", "off"]);
    expect(assistModeChoices("spanish")).toEqual(["accent", "off"]);
    expect(assistModeChoices("chinese")).toEqual(["hanzi", "pinyin", "off"]);
  });

  it("指定なしの単語帳には補助が無い", () => {
    expect(assistModeChoices(null)).toEqual([]);
  });
});

describe("isPinyinColumn", () => {
  it("列名に「拼音」「ピンイン」「pinyin」を含む列をピンインの列とみなす", () => {
    for (const name of ["拼音", "ピンイン", "Pinyin", "読み（pinyin）"]) {
      expect(isPinyinColumn(name)).toBe(true);
    }
    for (const name of ["意味", "単語", "例文"]) {
      expect(isPinyinColumn(name)).toBe(false);
    }
  });
});

describe("assistModeFor", () => {
  it("欧州系の言語では、選んでいなければどの列にもアクセント記号の補助を付ける", () => {
    expect(assistModeFor("french", 0, "単語")).toBe("accent");
    expect(assistModeFor("german", 1, "意味")).toBe("accent");
  });

  it("中国語では、選んでいなければ見出し語は簡体字、ピンインの列はピンイン、ほかの列は補助なし", () => {
    expect(assistModeFor("chinese", 0, "単語")).toBe("hanzi");
    expect(assistModeFor("chinese", 2, "拼音")).toBe("pinyin");
    expect(assistModeFor("chinese", 1, "意味")).toBe("off");
  });

  it("選んだ補助があればそれを使う。その言語で選べない値なら選んでいないものとみなす", () => {
    expect(assistModeFor("french", 1, "意味", "off")).toBe("off");
    expect(assistModeFor("chinese", 0, "単語", "pinyin")).toBe("pinyin");
    expect(assistModeFor("chinese", 1, "意味", "hanzi")).toBe("hanzi");
    expect(assistModeFor("french", 0, "単語", "hanzi")).toBe("accent");
    expect(assistModeFor("chinese", 0, "単語", "accent")).toBe("hanzi");
  });

  it("指定なしの単語帳は、どの列も補助なし", () => {
    expect(assistModeFor(null, 0, "単語")).toBe("off");
    expect(assistModeFor(null, 0, "単語", "accent")).toBe("off");
  });
});
