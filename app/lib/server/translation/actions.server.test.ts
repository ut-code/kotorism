import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { requireUser } from "@/lib/server/session.server";

import { submitTranslation } from "./actions.server";

vi.mock("@/lib/server/session.server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/server/study-events.server", () => ({ recordStudyEvent: vi.fn() }));

const valid = {
  language: "german",
  problemSource: "custom",
  direction: "toJapanese",
  customSourceText: "Guten Tag.",
  content: "こんにちは。",
  scoreMax: 10,
};

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
});

// API は request.json() の結果をそのまま渡してくるので、型が崩れた入力でも落ちずにエラーを返す必要がある
describe("submitTranslation の入力検証", () => {
  it.each([
    ["訳文が文字列でない", { ...valid, content: 123 }],
    ["原文が文字列でない", { ...valid, customSourceText: ["a"] }],
    ["満点が数値でない", { ...valid, scoreMax: "10" }],
    ["訳文が無い", { ...valid, content: undefined }],
    ["null", null],
  ])("%s場合は例外にせず error を返す", async (_label, input) => {
    const result = await submitTranslation(input as never);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("言語が不明なら従来どおりの文言で断る", async () => {
    expect(await submitTranslation({ ...valid, language: "klingon" })).toEqual({
      error: "言語が正しくありません。",
    });
  });

  it("満点が選択肢にないなら従来どおりの文言で断る", async () => {
    expect(await submitTranslation({ ...valid, scoreMax: 11 })).toEqual({
      error: "満点の指定が正しくありません。",
    });
  });
});
