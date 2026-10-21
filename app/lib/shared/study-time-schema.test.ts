import { describe, expect, it } from "vitest";

import { parseStudyTimeReport } from "./study-time-schema";

const deck = { kind: "deck", deckId: "nb1", mode: "study" } as const;
const section = { kind: "section", language: "french", sectionSlug: "03" } as const;
const report = { clientId: "abc-123_DEF", seconds: 30 };

describe("parseStudyTimeReport", () => {
  it("単語帳とセクションの学習時間を通す", () => {
    expect(parseStudyTimeReport({ ...report, activity: deck })).toEqual({
      success: true,
      data: { ...report, activity: deck },
    });
    expect(parseStudyTimeReport({ ...report, activity: section }).success).toBe(true);
  });

  it.each(["study", "review", "quiz"])("単語帳のモード %s を通す", (mode) => {
    expect(parseStudyTimeReport({ ...report, activity: { ...deck, mode } }).success).toBe(true);
  });

  it.each([
    ["clientId が無い", { seconds: 30, activity: deck }],
    ["clientId が空", { ...report, clientId: "", activity: deck }],
    ["clientId に使えない文字を含む", { ...report, clientId: "a b/c", activity: deck }],
    ["clientId が長すぎる", { ...report, clientId: "a".repeat(65), activity: deck }],
    ["clientId が文字列でない", { ...report, clientId: 1, activity: deck }],
    ["秒数が 0", { ...report, seconds: 0, activity: deck }],
    ["秒数が負", { ...report, seconds: -5, activity: deck }],
    ["秒数が無限大", { ...report, seconds: Infinity, activity: deck }],
    ["秒数が NaN", { ...report, seconds: NaN, activity: deck }],
    ["秒数が文字列", { ...report, seconds: "30", activity: deck }],
    ["activity が無い", report],
    ["activity の種類が不明", { ...report, activity: { kind: "video" } }],
    ["単語帳のモードが不明", { ...report, activity: { ...deck, mode: "cheat" } }],
    ["deckId が文字列でない", { ...report, activity: { ...deck, deckId: 1 } }],
    ["セクション番号が文字列でない", { ...report, activity: { ...section, sectionSlug: 3 } }],
    ["言語が無い", { ...report, activity: { kind: "section", sectionSlug: "03" } }],
    ["オブジェクトでない", null],
  ])("%s場合は拒否する", (_label, input) => {
    expect(parseStudyTimeReport(input).success).toBe(false);
  });
});
