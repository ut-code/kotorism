import { describe, expect, it } from "vitest";

import * as chinese from "@/routes/learn._chinese.chinese.05/quiz-data";
import * as french1 from "@/routes/learn._french.french.05/quiz-data";
import * as french2 from "@/routes/learn._french.french.06/quiz-data";
import * as germanCase from "@/routes/learn._german.german.05/quiz-data";
import * as germanOther from "@/routes/learn._german.german.06/quiz-data";
import * as spanish from "@/routes/learn._spanish.spanish.05/quiz-data";

import {
  BLANK,
  filterByUnits,
  findQuestionProblems,
  type GrammarQuestion,
  type GrammarUnitDef,
} from "./grammar-quiz";

const UNITS: GrammarUnitDef[] = [
  { id: "aux-verb", label: "助動詞の否定" },
  { id: "negation", label: "否定表現" },
  { id: "aspect", label: "時相・アスペクト" },
  { id: "preposition", label: "介詞" },
];

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

const problems = (questions: GrammarQuestion[]) => findQuestionProblems(questions, UNITS);

describe("findQuestionProblems", () => {
  it("正しい問題には問題点がない", () => {
    expect(problems([question(), blank()])).toEqual([]);
  });

  it("解説が空の問題を見つける", () => {
    expect(problems([question({ explanation: " " })])).toHaveLength(1);
    expect(problems([blank({ explanation: "" })])).toHaveLength(1);
  });

  it("id の重複を見つける", () => {
    expect(problems([question({ id: "x" }), blank({ id: "x" })])).toHaveLength(1);
  });

  it("選択肢が4つでない・重複する・正解を含まない問題を見つける", () => {
    expect(problems([question({ choices: ["a", "b", "c"] })])).toHaveLength(1);
    expect(problems([question({ choices: ["a", "a", "c", "d"] })])).toHaveLength(1);
    expect(problems([question({ answer: "z" })])).toHaveLength(1);
  });

  it("穴埋め・文脈の問題文に空欄がちょうど1つない問題を見つける", () => {
    expect(problems([blank({ prompt: "我不想去。" })])).toHaveLength(1);
    expect(problems([blank({ prompt: `${BLANK}${BLANK}` })])).toHaveLength(1);
    expect(problems([blank({ focus: "context", prompt: "A：好。" })])).toHaveLength(1);
  });

  it("穴埋めの問題に日本語訳（note）が無いのを見つける", () => {
    expect(problems([blank({ note: undefined })])).toHaveLength(1);
  });

  it("単元タグが無い・知らない単元タグが付いた問題を見つける", () => {
    expect(problems([question({ units: [] })])).toHaveLength(1);
    expect(problems([blank({ units: ["unknown"] })])).toHaveLength(1);
  });

  it("同じ単元タグが重複している問題を見つける", () => {
    expect(problems([question({ units: ["aspect", "aspect"] })])).toHaveLength(1);
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

// 言語ごとの文法クイズ（単元の定義と出題データ）。
// requiredUnits はそのクイズに必ず含める単元、minPerUnit は1単元あたりの最低問題数
const QUIZZES: {
  quiz: string;
  grammarUnits: readonly GrammarUnitDef[];
  grammarQuiz: GrammarQuestion[];
  requiredUnits: string[];
  minPerUnit: number;
}[] = [
  {
    quiz: "中国語",
    ...chinese,
    requiredUnits: ["measure-word", "comparison"],
    minPerUnit: 5,
  },
  // フランス語は覚える規則が多いので、基本を「名詞・文のしくみ」と「代名詞・動詞」の2つに分ける
  {
    quiz: "フランス語（基本1）",
    ...french1,
    requiredUnits: ["article", "agreement", "negation", "interrogative", "comparison", "place"],
    minPerUnit: 6,
  },
  {
    quiz: "フランス語（基本2）",
    ...french2,
    requiredUnits: ["pronoun", "stressed", "reflexive", "relative", "near-tense", "imperative"],
    minPerUnit: 6,
  },
  // 格変化はドイツ語の学習で特に重いので、単元を細かく分け、どの単元も多めに出題する
  {
    quiz: "ドイツ語（格変化）",
    ...germanCase,
    requiredUnits: [
      "definite",
      "indefinite",
      "pronoun",
      "reflexive",
      "verb-case",
      "preposition",
      "adjective",
    ],
    minPerUnit: 8,
  },
  {
    quiz: "ドイツ語（その他）",
    ...germanOther,
    requiredUnits: ["word-order", "negation", "perfect", "modal"],
    minPerUnit: 5,
  },
  {
    quiz: "スペイン語（基本）",
    ...spanish,
    requiredUnits: ["reflexive", "negation", "interrogative"],
    minPerUnit: 5,
  },
];

describe.each(QUIZZES)(
  "$quiz の文法クイズの出題データ",
  ({ grammarUnits, grammarQuiz, requiredUnits, minPerUnit }) => {
    it("どの問題にも不備がない（全問が選択肢4つの4択・解説付きなど）", () => {
      expect(findQuestionProblems(grammarQuiz, grammarUnits)).toEqual([]);
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

    it("必要な単元をそろえている", () => {
      expect(grammarUnits.map((u) => u.id)).toEqual(expect.arrayContaining(requiredUnits));
    });

    it("単元は4〜8種あり、どの単元にも決まった数以上の問題がある", () => {
      expect(grammarUnits.length).toBeGreaterThanOrEqual(4);
      expect(grammarUnits.length).toBeLessThanOrEqual(8);
      for (const unit of grammarUnits) {
        const count = grammarQuiz.filter((q) => q.units.includes(unit.id)).length;
        expect(count, unit.label).toBeGreaterThanOrEqual(minPerUnit);
      }
    });

    it("どの単元にも穴埋めとそれ以外の観点の問題がある", () => {
      for (const unit of grammarUnits) {
        const focuses = new Set(
          grammarQuiz.filter((q) => q.units.includes(unit.id)).map((q) => q.focus),
        );
        expect(focuses.has("blank"), unit.label).toBe(true);
        expect(focuses.size, unit.label).toBeGreaterThanOrEqual(2);
      }
    });
  },
);
