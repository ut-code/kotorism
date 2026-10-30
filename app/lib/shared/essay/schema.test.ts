import { describe, expect, it } from "vite-plus/test";

import { parseSubmitEssayInput } from "./schema";

const valid = {
  language: "french",
  topicSource: "preset",
  topicId: "intro",
  content: "Bonjour.",
  criteriaMax: { vocabulary: 5, grammar: 4, structure: 3, content: 2 },
};

describe("parseSubmitEssayInput", () => {
  it("プリセットのお題の提出を通す", () => {
    expect(parseSubmitEssayInput(valid)).toEqual({ success: true, data: valid });
  });

  it("カスタムお題の提出を通す", () => {
    const custom = {
      ...valid,
      topicSource: "custom",
      topicId: undefined,
      customTopicPrompt: "自己紹介を書く",
      customTargetWordCount: 40,
    };
    expect(parseSubmitEssayInput(custom).success).toBe(true);
  });

  it.each([
    ["言語が文字列でない", { ...valid, language: 1 }],
    ["お題の指定方法が不明", { ...valid, topicSource: "other" }],
    ["お題の指定方法が無い", { ...valid, topicSource: undefined }],
    ["本文が文字列でない", { ...valid, content: 123 }],
    ["本文が無い", { ...valid, content: undefined }],
    ["配点が無い", { ...valid, criteriaMax: undefined }],
    ["配点が null", { ...valid, criteriaMax: null }],
    ["配点の一部が無い", { ...valid, criteriaMax: { vocabulary: 5 } }],
    ["配点が数値でない", { ...valid, criteriaMax: { ...valid.criteriaMax, grammar: "5" } }],
    ["お題 ID が文字列でない", { ...valid, topicId: 1 }],
    ["お題文が文字列でない", { ...valid, customTopicPrompt: {} }],
    ["分量目安が数値でない", { ...valid, customTargetWordCount: "40" }],
    ["オブジェクトでない", null],
    ["文字列", "french"],
  ])("%s場合は拒否する", (_label, input) => {
    expect(parseSubmitEssayInput(input).success).toBe(false);
  });

  it("失敗時は画面に出せるメッセージを返す", () => {
    const result = parseSubmitEssayInput({ ...valid, content: 123 });
    expect(result).toEqual({ success: false, error: expect.any(String) });
    expect(result.success === false && result.error).not.toBe("");
  });
});
