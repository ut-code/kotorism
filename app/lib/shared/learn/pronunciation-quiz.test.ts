import { describe, expect, it } from "vite-plus/test";

import {
  pronunciationQuiz,
  pronunciationUnits as units,
} from "@/routes/learn._french.french.09/quiz-data";

import { BLANK, type GrammarUnitDef } from "./grammar-quiz";
import {
  findPronunciationProblems,
  speechForChoice,
  type PronunciationQuestion,
} from "./pronunciation-quiz";

const UNITS: GrammarUnitDef[] = [
  { id: "nasal", label: "鼻母音" },
  { id: "liaison", label: "リエゾン" },
];

const listening = (overrides: Partial<PronunciationQuestion> = {}): PronunciationQuestion => ({
  kind: "listening",
  id: "l1",
  units: ["nasal"],
  prompt: `p${BLANK}`,
  speech: "pain",
  note: "パン",
  choices: ["ain", "an", "on", "ou"],
  answer: "ain",
  explanation: "解説",
  ...overrides,
});

const rule = (overrides: Partial<PronunciationQuestion> = {}): PronunciationQuestion => ({
  kind: "rule",
  id: "r1",
  units: ["liaison"],
  prompt: "リエゾンで s は何の音になる？",
  choices: ["[z]", "[s]", "[ks]", "読まない"],
  answer: "[z]",
  explanation: "解説",
  ...overrides,
});

const reading = (overrides: Partial<PronunciationQuestion> = {}): PronunciationQuestion => ({
  kind: "reading",
  id: "d1",
  units: ["nasal"],
  prompt: "bonne",
  choices: ["[bɔn]", "[bɔ̃]", "[bun]", "[byn]"],
  choiceSpeech: ["bonne", "bon", "boune", "bune"],
  answer: "[bɔn]",
  explanation: "解説",
  ...overrides,
});

const problems = (questions: PronunciationQuestion[]) =>
  findPronunciationProblems(questions, UNITS);

describe("findPronunciationProblems", () => {
  it("正しい問題には問題点がない", () => {
    expect(problems([listening(), rule(), reading()])).toEqual([]);
  });

  it("id の重複・解説の欠落・知らない単元タグを見つける", () => {
    expect(problems([listening({ id: "x" }), rule({ id: "x" })])).toHaveLength(1);
    expect(problems([rule({ explanation: " " })])).toHaveLength(1);
    expect(problems([rule({ units: ["unknown"] })])).toHaveLength(1);
    expect(problems([rule({ units: [] })])).toHaveLength(1);
  });

  it("選択肢が4つでない・重複する・正解を含まない問題を見つける", () => {
    expect(problems([rule({ choices: ["[z]", "[s]", "[ks]"] })])).toHaveLength(1);
    expect(problems([rule({ choices: ["[z]", "[z]", "[ks]", "x"] })])).toHaveLength(1);
    expect(problems([rule({ answer: "[ʃ]" })])).toHaveLength(1);
  });

  it("聞き取り: 空欄がちょうど1つで、正解を入れると読み上げる語になる", () => {
    expect(problems([listening({ prompt: "pain" })])).toHaveLength(1);
    expect(problems([listening({ speech: "pont" })])).toHaveLength(1);
    expect(problems([listening({ speech: undefined })])).toHaveLength(1);
  });

  it("読み方: どの選択肢にも別々の読み上げがあり、正解はその語自体を読み上げる", () => {
    expect(problems([reading({ choiceSpeech: ["bonne", "bon", "boune"] })])).toHaveLength(1);
    expect(problems([reading({ choiceSpeech: ["bonne", "bon", "bon", "bune"] })])).toHaveLength(1);
    expect(problems([reading({ choiceSpeech: ["bone", "bon", "boune", "bune"] })])).toHaveLength(1);
  });

  it("ルール: 読み上げを持たない", () => {
    expect(problems([rule({ speech: "x" })])).toHaveLength(1);
  });
});

describe("speechForChoice", () => {
  it("読み方の問題では、選択肢に対応する読み上げの文字列を返す", () => {
    expect(speechForChoice(reading(), "[bun]")).toBe("boune");
    expect(speechForChoice(reading(), "[bɔn]")).toBe("bonne");
  });

  it("読み上げの無い問題・選択肢には undefined を返す", () => {
    expect(speechForChoice(rule(), "[z]")).toBeUndefined();
    expect(speechForChoice(reading(), "[xx]")).toBeUndefined();
  });
});

describe("フランス語の発音クイズの出題データ", () => {
  it("どの問題にも不備がない", () => {
    expect(findPronunciationProblems(pronunciationQuiz, units)).toEqual([]);
  });

  it("聞き取り・ルール・読み方の3つの形式をすべて含む", () => {
    expect(new Set(pronunciationQuiz.map((q) => q.kind))).toEqual(
      new Set(["listening", "rule", "reading"]),
    );
  });

  it("正解の位置が1番目に偏っていない", () => {
    const first = pronunciationQuiz.filter((q) => q.choices[0] === q.answer).length;
    expect(first).toBeLessThan(pronunciationQuiz.length / 2);
  });

  it("単元は4〜8種あり、どの単元にも6問以上・2つ以上の形式の問題がある", () => {
    expect(units.length).toBeGreaterThanOrEqual(4);
    expect(units.length).toBeLessThanOrEqual(8);
    for (const unit of units) {
      const questions = pronunciationQuiz.filter((q) => q.units.includes(unit.id));
      expect(questions.length, unit.label).toBeGreaterThanOrEqual(6);
      expect(new Set(questions.map((q) => q.kind)).size, unit.label).toBeGreaterThanOrEqual(2);
    }
  });
});
