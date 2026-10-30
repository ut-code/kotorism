import { describe, expect, it } from "vite-plus/test";

import {
  CARD_HEAD_MAX_LENGTH,
  CARD_VALUE_MAX_LENGTH,
  COLUMN_NAME_MAX_LENGTH,
  MAX_STAR_COUNT,
  NOTEBOOK_TITLE_MAX_LENGTH,
  parseCardHead,
  parseCardValue,
  parseColumnName,
  parseMove,
  parseDuplicateChoice,
  parseNotebookLanguage,
  parseNotebookTitle,
  parseNewNotebookTitle,
  DEFAULT_NOTEBOOK_TITLE,
  parseStarCount,
} from "./notebook-schema";

describe("parseNotebookTitle", () => {
  it("前後の空白を取り除いて返す", () => {
    expect(parseNotebookTitle("  今日の単語  ")).toEqual({ success: true, data: "今日の単語" });
  });

  it("空・空白のみ・上限超過・文字列以外はエラーメッセージ付きで拒否する", () => {
    for (const input of ["", "   ", "あ".repeat(NOTEBOOK_TITLE_MAX_LENGTH + 1), null, 1]) {
      const result = parseNotebookTitle(input);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toBeTruthy();
    }
    expect(parseNotebookTitle("あ".repeat(NOTEBOOK_TITLE_MAX_LENGTH)).success).toBe(true);
  });
});

describe("parseColumnName", () => {
  it("空と上限超過を拒否する", () => {
    expect(parseColumnName(" 意味 ")).toEqual({ success: true, data: "意味" });
    expect(parseColumnName("").success).toBe(false);
    expect(parseColumnName("a".repeat(COLUMN_NAME_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe("parseCardHead", () => {
  it("見出し語は必須で、上限を超えたら拒否する", () => {
    expect(parseCardHead(" chat ")).toEqual({ success: true, data: "chat" });
    expect(parseCardHead("  ").success).toBe(false);
    expect(parseCardHead("a".repeat(CARD_HEAD_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe("parseCardValue", () => {
  it("空は許可(未入力の欄)し、上限を超えたら拒否する", () => {
    expect(parseCardValue("  ")).toEqual({ success: true, data: "" });
    expect(parseCardValue("a".repeat(CARD_VALUE_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe("parseStarCount", () => {
  it("整数に丸め、0 以上 MAX_STAR_COUNT 以下に収める。不正な値は 0", () => {
    expect(parseStarCount("3")).toBe(3);
    expect(parseStarCount("2.9")).toBe(2);
    expect(parseStarCount("-5")).toBe(0);
    expect(parseStarCount("abc")).toBe(0);
    expect(parseStarCount(null)).toBe(0);
    expect(parseStarCount("999999999")).toBe(MAX_STAR_COUNT);
  });
});

describe("parseMove", () => {
  it("並べ替えの「何番目を」「どの間へ」を、0以上の整数として受け取る", () => {
    expect(parseMove({ from: "2", insertAt: "0" })).toEqual({
      success: true,
      data: { from: 2, insertAt: 0 },
    });
  });

  it("数でない・負の数・小数は拒否する", () => {
    expect(parseMove({ from: "a", insertAt: "0" }).success).toBe(false);
    expect(parseMove({ from: "-1", insertAt: "0" }).success).toBe(false);
    expect(parseMove({ from: "1.5", insertAt: "0" }).success).toBe(false);
    expect(parseMove({ from: "1" }).success).toBe(false);
  });
});

describe("parseNewNotebookTitle", () => {
  it("新しく作る単語帳は、タイトルが空なら「無題の単語帳」にする", () => {
    expect(DEFAULT_NOTEBOOK_TITLE).toBe("無題の単語帳");
    expect(parseNewNotebookTitle(null)).toEqual({ success: true, data: "無題の単語帳" });
    expect(parseNewNotebookTitle("  ")).toEqual({ success: true, data: "無題の単語帳" });
  });

  it("タイトルがあれば、そのタイトルで作る（上限は通常のタイトルと同じ）", () => {
    expect(parseNewNotebookTitle(" 11月の英単語 ")).toEqual({
      success: true,
      data: "11月の英単語",
    });
    expect(parseNewNotebookTitle("a".repeat(NOTEBOOK_TITLE_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe("parseDuplicateChoice", () => {
  it("名前が重なったときの選び方（このまま・番号・日付）を受け取り、無ければ undefined", () => {
    expect(parseDuplicateChoice("keep")).toEqual({ success: true, data: "keep" });
    expect(parseDuplicateChoice("number")).toEqual({ success: true, data: "number" });
    expect(parseDuplicateChoice("date")).toEqual({ success: true, data: "date" });
    expect(parseDuplicateChoice(null)).toEqual({ success: true, data: undefined });
    expect(parseDuplicateChoice("other").success).toBe(false);
  });
});

describe("parseNotebookLanguage", () => {
  it("4言語はそのまま、空（指定なし）は null にする", () => {
    expect(parseNotebookLanguage("chinese")).toEqual({ success: true, data: "chinese" });
    expect(parseNotebookLanguage("")).toEqual({ success: true, data: null });
  });

  it("それ以外の値は拒否する", () => {
    for (const input of ["english", null, 1]) {
      expect(parseNotebookLanguage(input).success).toBe(false);
    }
  });
});
