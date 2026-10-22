import { describe, expect, it } from "vitest";

import { chineseQuizSupport, quizHint } from "./notebook-quiz";

describe("chineseQuizSupport", () => {
  it("中国語のテンプレートの列で拼音を答えるとき、意味の列をヒントにし、見出し語を中国語で読み上げる", () => {
    expect(chineseQuizSupport(["単語", "意味", "拼音"], "拼音")).toEqual({
      hintColumn: "意味",
      speechLang: "zh-CN",
    });
  });

  it("テンプレートの後ろに列を足していても使える", () => {
    expect(chineseQuizSupport(["単語", "意味", "拼音", "例文"], "拼音")).not.toBeNull();
  });

  it("拼音以外を答えるときは使わない", () => {
    expect(chineseQuizSupport(["単語", "意味", "拼音"], "意味")).toBeNull();
  });

  it("1行目がテンプレートと違う単語帳では使わない", () => {
    expect(chineseQuizSupport(["見出し語", "意味", "拼音"], "拼音")).toBeNull();
    expect(chineseQuizSupport(["単語", "拼音", "意味"], "拼音")).toBeNull();
    expect(chineseQuizSupport(["単語", "意味"], "意味")).toBeNull();
  });
});

describe("quizHint", () => {
  const rows = [
    { 意味: "夫", 拼音: "zhàngfu" },
    { 意味: "一人前の男", 拼音: "zhàngfū" },
    { 意味: "おっと", 拼音: "zhàngfu" },
  ];

  it("正解と同じ組のヒントの列の値を、重複なく「、」でつなぐ", () => {
    expect(quizHint(rows, "拼音", "zhàngfu", "意味")).toBe("夫、おっと");
  });

  it("ヒントの値が無ければ空文字", () => {
    expect(quizHint([{ 拼音: "lìzi" }], "拼音", "lìzi", "意味")).toBe("");
  });
});
