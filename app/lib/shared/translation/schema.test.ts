import { describe, expect, it } from "vite-plus/test";

import { parseSubmitTranslationInput } from "./schema";

const valid = {
  language: "german",
  problemSource: "preset",
  problemId: "greeting-1",
  content: "Guten Tag.",
  scoreMax: 10,
};

describe("parseSubmitTranslationInput", () => {
  it("プリセットの問題の提出を通す", () => {
    expect(parseSubmitTranslationInput(valid)).toEqual({ success: true, data: valid });
  });

  it("カスタム原文の提出を通す", () => {
    const custom = {
      ...valid,
      problemSource: "custom",
      problemId: undefined,
      direction: "toJapanese",
      customSourceText: "Guten Tag.",
    };
    expect(parseSubmitTranslationInput(custom).success).toBe(true);
  });

  it.each([
    ["言語が文字列でない", { ...valid, language: null }],
    ["題材の指定方法が不明", { ...valid, problemSource: "other" }],
    ["訳す方向が不明", { ...valid, problemSource: "custom", direction: "sideways" }],
    ["問題 ID が文字列でない", { ...valid, problemId: 1 }],
    ["原文が文字列でない", { ...valid, customSourceText: [] }],
    ["訳文が文字列でない", { ...valid, content: 123 }],
    ["訳文が無い", { ...valid, content: undefined }],
    ["満点が数値でない", { ...valid, scoreMax: "10" }],
    ["満点が無い", { ...valid, scoreMax: undefined }],
    ["オブジェクトでない", null],
  ])("%s場合は拒否する", (_label, input) => {
    expect(parseSubmitTranslationInput(input).success).toBe(false);
  });
});
