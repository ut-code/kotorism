import { describe, expect, it } from "vitest";

import { PRACTICE_LANGUAGES, getPracticeLanguage } from "./practice-languages";

describe("getPracticeLanguage", () => {
  it("フランス語・ドイツ語・スペイン語の設定を返す", () => {
    expect(getPracticeLanguage("french")).toBe(PRACTICE_LANGUAGES.french);
    expect(getPracticeLanguage("german")).toBe(PRACTICE_LANGUAGES.german);
    expect(getPracticeLanguage("spanish")).toBe(PRACTICE_LANGUAGES.spanish);
  });

  it("特殊文字の設定がない言語は undefined", () => {
    expect(getPracticeLanguage("chinese")).toBeUndefined();
    expect(getPracticeLanguage("toString")).toBeUndefined();
  });
});
