import { describe, expect, it } from "vitest";

import { auxiliaryVerbQuiz } from "@/routes/learn._chinese.chinese.05/quiz-data";

import {
  BLANK,
  findQuestionProblems,
  isFillInCorrect,
  normalizeChineseAnswer,
  type AuxVerbQuestion,
} from "./aux-verb-quiz";

describe("normalizeChineseAnswer", () => {
  it("空白・句読点を取り除き、小文字にする", () => {
    expect(normalizeChineseAnswer(" 不 用。")).toBe("不用");
    expect(normalizeChineseAnswer("Bu Yong")).toBe("buyong");
  });

  it("ピンインの声調記号・声調番号を取り除く", () => {
    expect(normalizeChineseAnswer("bú yòng")).toBe("buyong");
    expect(normalizeChineseAnswer("bu2yong4")).toBe("buyong");
  });

  it("ü は v と同じに扱う", () => {
    expect(normalizeChineseAnswer("lǜ")).toBe(normalizeChineseAnswer("lv"));
  });

  it("全角英字を半角に揃える", () => {
    expect(normalizeChineseAnswer("ｂｕｙｏｎｇ")).toBe("buyong");
  });
});

describe("isFillInCorrect", () => {
  const q = { answer: "不用", pinyin: "bú yòng" };

  it("漢字で正解できる", () => {
    expect(isFillInCorrect("不用", q)).toBe(true);
    expect(isFillInCorrect(" 不用 ", q)).toBe(true);
  });

  it("ピンインで正解できる（声調記号の有無は問わない）", () => {
    expect(isFillInCorrect("bú yòng", q)).toBe(true);
    expect(isFillInCorrect("buyong", q)).toBe(true);
  });

  it("別の助動詞は不正解", () => {
    expect(isFillInCorrect("不要", q)).toBe(false);
    expect(isFillInCorrect("buyao", q)).toBe(false);
    expect(isFillInCorrect("", q)).toBe(false);
  });
});

const choice = (
  overrides: Partial<AuxVerbQuestion & { kind: "choice" }> = {},
): AuxVerbQuestion => ({
  kind: "choice",
  focus: "meaning",
  id: "c1",
  prompt: "我不想去。",
  choices: ["a", "b", "c", "d"],
  answer: "a",
  explanation: "解説",
  ...overrides,
});

const fill = (overrides: Partial<AuxVerbQuestion & { kind: "fill" }> = {}): AuxVerbQuestion => ({
  kind: "fill",
  id: "f1",
  sentence: `我${BLANK}去。`,
  translation: "私は行きたくない。",
  answer: "不想",
  pinyin: "bù xiǎng",
  explanation: "解説",
  ...overrides,
});

describe("findQuestionProblems", () => {
  it("正しい問題には問題点がない", () => {
    expect(findQuestionProblems([choice(), fill()])).toEqual([]);
  });

  it("解説が空の問題を見つける", () => {
    expect(findQuestionProblems([choice({ explanation: " " })])).toHaveLength(1);
    expect(findQuestionProblems([fill({ explanation: "" })])).toHaveLength(1);
  });

  it("id の重複を見つける", () => {
    expect(findQuestionProblems([choice({ id: "x" }), fill({ id: "x" })])).toHaveLength(1);
  });

  it("選択肢が4つでない・重複する・正解を含まない問題を見つける", () => {
    expect(findQuestionProblems([choice({ choices: ["a", "b", "c"] })])).toHaveLength(1);
    expect(findQuestionProblems([choice({ choices: ["a", "a", "c", "d"] })])).toHaveLength(1);
    expect(findQuestionProblems([choice({ answer: "z" })])).toHaveLength(1);
  });

  it("穴埋めの文に空欄がちょうど1つない問題を見つける", () => {
    expect(findQuestionProblems([fill({ sentence: "我不想去。" })])).toHaveLength(1);
    expect(findQuestionProblems([fill({ sentence: `${BLANK}${BLANK}` })])).toHaveLength(1);
  });
});

describe("助動詞の否定表現クイズの出題データ", () => {
  it("どの問題にも不備がない（解説付き・選択肢4つなど）", () => {
    expect(findQuestionProblems(auxiliaryVerbQuiz)).toEqual([]);
  });

  it("4択と穴埋めの2形式を含む", () => {
    const kinds = new Set(auxiliaryVerbQuiz.map((q) => q.kind));
    expect(kinds).toEqual(new Set(["choice", "fill"]));
  });

  it("4択は「意味」「形」「文脈」の3つの観点をすべて含む", () => {
    const focuses = new Set(
      auxiliaryVerbQuiz.flatMap((q) => (q.kind === "choice" ? [q.focus] : [])),
    );
    expect(focuses).toEqual(new Set(["meaning", "form", "context"]));
  });
});
