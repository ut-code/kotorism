import { describe, expect, it } from "vitest";

import { grammarQuiz } from "@/routes/learn._chinese.chinese.05/quiz-data";

import {
  BLANK,
  filterByUnits,
  findQuestionProblems,
  GRAMMAR_UNITS,
  type GrammarQuestion,
} from "./grammar-quiz";

const question = (overrides: Partial<GrammarQuestion> = {}): GrammarQuestion => ({
  focus: "meaning",
  id: "c1",
  units: ["aux-verb"],
  prompt: "我不想去。",
  choices: ["a", "b", "c", "d"],
  answer: "a",
  explanation: "解説",
  ...overrides,
});

const blank = (overrides: Partial<GrammarQuestion> = {}): GrammarQuestion =>
  question({
    focus: "blank",
    id: "b1",
    prompt: `我${BLANK}去。`,
    note: "私は行きたくない。",
    choices: ["不想", "不用", "不会", "不能"],
    answer: "不想",
    ...overrides,
  });

describe("findQuestionProblems", () => {
  it("正しい問題には問題点がない", () => {
    expect(findQuestionProblems([question(), blank()])).toEqual([]);
  });

  it("解説が空の問題を見つける", () => {
    expect(findQuestionProblems([question({ explanation: " " })])).toHaveLength(1);
    expect(findQuestionProblems([blank({ explanation: "" })])).toHaveLength(1);
  });

  it("id の重複を見つける", () => {
    expect(findQuestionProblems([question({ id: "x" }), blank({ id: "x" })])).toHaveLength(1);
  });

  it("選択肢が4つでない・重複する・正解を含まない問題を見つける", () => {
    expect(findQuestionProblems([question({ choices: ["a", "b", "c"] })])).toHaveLength(1);
    expect(findQuestionProblems([question({ choices: ["a", "a", "c", "d"] })])).toHaveLength(1);
    expect(findQuestionProblems([question({ answer: "z" })])).toHaveLength(1);
  });

  it("穴埋め・文脈の問題文に空欄がちょうど1つない問題を見つける", () => {
    expect(findQuestionProblems([blank({ prompt: "我不想去。" })])).toHaveLength(1);
    expect(findQuestionProblems([blank({ prompt: `${BLANK}${BLANK}` })])).toHaveLength(1);
    expect(findQuestionProblems([blank({ focus: "context", prompt: "A：好。" })])).toHaveLength(1);
  });

  it("穴埋めの問題に日本語訳（note）が無いのを見つける", () => {
    expect(findQuestionProblems([blank({ note: undefined })])).toHaveLength(1);
  });

  it("単元タグが無い・知らない単元タグが付いた問題を見つける", () => {
    expect(findQuestionProblems([question({ units: [] })])).toHaveLength(1);
    // oxlint-disable-next-line typescript/no-explicit-any
    expect(findQuestionProblems([blank({ units: ["unknown" as any] })])).toHaveLength(1);
  });

  it("同じ単元タグが重複している問題を見つける", () => {
    expect(findQuestionProblems([question({ units: ["aspect", "aspect"] })])).toHaveLength(1);
  });
});

describe("filterByUnits", () => {
  const questions = [
    question({ id: "a", units: ["aspect"] }),
    question({ id: "b", units: ["negation", "aspect"] }),
    blank({ id: "c", units: ["preposition"] }),
  ];
  const ids = (qs: GrammarQuestion[]) => qs.map((q) => q.id);

  it("選んだ単元のどれかが付いた問題だけを返す", () => {
    expect(ids(filterByUnits(questions, new Set(["aspect"])))).toEqual(["a", "b"]);
    expect(ids(filterByUnits(questions, new Set(["negation", "preposition"])))).toEqual(["b", "c"]);
  });

  it("単元を1つも選んでいなければ出題しない", () => {
    expect(filterByUnits(questions, new Set())).toEqual([]);
  });
});

describe("文法クイズの出題データ", () => {
  it("どの問題にも不備がない（全問が選択肢4つの4択・解説付きなど）", () => {
    expect(findQuestionProblems(grammarQuiz)).toEqual([]);
  });

  it("「意味」「形」「文脈」「穴埋め」の4つの観点をすべて含む", () => {
    expect(new Set(grammarQuiz.map((q) => q.focus))).toEqual(
      new Set(["meaning", "form", "context", "blank"]),
    );
  });

  it("正解の位置が1番目に偏っていない", () => {
    const first = grammarQuiz.filter((q) => q.choices[0] === q.answer).length;
    expect(first).toBeLessThan(grammarQuiz.length / 2);
  });

  it("単元は4〜6種あり、どの単元にも5問以上ある", () => {
    expect(GRAMMAR_UNITS.length).toBeGreaterThanOrEqual(4);
    expect(GRAMMAR_UNITS.length).toBeLessThanOrEqual(6);
    for (const unit of GRAMMAR_UNITS) {
      const count = grammarQuiz.filter((q) => q.units.includes(unit.id)).length;
      expect(count, unit.label).toBeGreaterThanOrEqual(5);
    }
  });

  it("どの単元にも穴埋めとそれ以外の観点の問題がある", () => {
    for (const unit of GRAMMAR_UNITS) {
      const focuses = new Set(
        grammarQuiz.filter((q) => q.units.includes(unit.id)).map((q) => q.focus),
      );
      expect(focuses.has("blank"), unit.label).toBe(true);
      expect(focuses.size, unit.label).toBeGreaterThanOrEqual(2);
    }
  });
});
