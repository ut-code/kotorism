import { describe, expect, it } from "vitest";

import { parseLearnAction, parseSectionKey } from "./schema";

describe("parseSectionKey", () => {
  it("対応言語と数字のセクション番号は通す", () => {
    expect(parseSectionKey({ language: "french", sectionSlug: "04" })).toEqual({
      success: true,
      data: { language: "french", sectionSlug: "04" },
    });
  });

  it.each([
    { language: "klingon", sectionSlug: "01" },
    { language: "french", sectionSlug: "../etc" },
    { language: "french", sectionSlug: "" },
    { language: "french", sectionSlug: "1".repeat(10) },
    { language: "", sectionSlug: "01" },
    { language: 1, sectionSlug: "01" },
    { sectionSlug: "01" },
    null,
    "french",
  ])("%j は拒否する", (input) => {
    expect(parseSectionKey(input).success).toBe(false);
  });
});

describe("parseLearnAction", () => {
  const key = { language: "chinese", sectionSlug: "05" };

  it("intent ごとに必要な項目を検証する", () => {
    expect(parseLearnAction({ intent: "quizAnswer", ...key, correct: true })).toMatchObject({
      success: true,
      data: { intent: "quizAnswer", correct: true },
    });
    for (const intent of ["markReviewed", "toggleManualTag", "recordView"]) {
      expect(parseLearnAction({ intent, ...key }).success).toBe(true);
    }
  });

  it("quizAnswer の correct は真偽値でなければ拒否する", () => {
    expect(parseLearnAction({ intent: "quizAnswer", ...key }).success).toBe(false);
    expect(parseLearnAction({ intent: "quizAnswer", ...key, correct: "true" }).success).toBe(false);
  });

  it("未知の intent や不正な言語・セクションは拒否する", () => {
    expect(parseLearnAction({ intent: "drop", ...key }).success).toBe(false);
    expect(
      parseLearnAction({ intent: "markReviewed", language: "x", sectionSlug: "01" }).success,
    ).toBe(false);
    expect(parseLearnAction(undefined).success).toBe(false);
  });
});
