import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { requireUser } from "@/lib/server/session.server";

import { submitEssay } from "./actions.server";

vi.mock("@/lib/server/session.server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/server/study-events.server", () => ({ recordStudyEvent: vi.fn() }));

const criteriaMax = { vocabulary: 5, grammar: 5, structure: 5, content: 5 };
const valid = {
  language: "french",
  topicSource: "custom",
  customTopicPrompt: "自己紹介を書く",
  customTargetWordCount: 40,
  content: "Bonjour.",
  criteriaMax,
};

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
});

// API は request.json() の結果をそのまま渡してくるので、型が崩れた入力でも落ちずにエラーを返す必要がある
describe("submitEssay の入力検証", () => {
  it.each([
    ["本文が文字列でない", { ...valid, content: 123 }],
    ["配点が null", { ...valid, criteriaMax: null }],
    ["配点の一部が無い", { ...valid, criteriaMax: { vocabulary: 5 } }],
    ["お題文が文字列でない", { ...valid, customTopicPrompt: { a: 1 } }],
    ["本文だけの文字列", "content"],
    ["null", null],
  ])("%s場合は例外にせず error を返す", async (_label, input) => {
    const result = await submitEssay(input as never);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("言語が不明なら従来どおりの文言で断る", async () => {
    expect(await submitEssay({ ...valid, language: "klingon" })).toEqual({
      error: "言語が正しくありません。",
    });
  });
});
