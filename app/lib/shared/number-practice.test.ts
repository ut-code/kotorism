import { describe, expect, it } from "vitest";

import {
  buildNumberPracticeItems,
  matchesAnyAnswer,
  pickDistractors,
  type NumberPracticeItem,
} from "./number-practice";

const num = (value: number, answer: string): NumberPracticeItem => ({
  id: `n${value}`,
  kind: "number",
  prompt: String(value),
  value,
  answer,
  alternatives: [],
});
const time = (prompt: string, answer: string): NumberPracticeItem => {
  const [h, m] = prompt.split(":").map(Number);
  return { id: `t${prompt}`, kind: "time", prompt, value: h * 60 + m, answer, alternatives: [] };
};

describe("pickDistractors", () => {
  const numbers = [
    num(7, "sept"),
    num(17, "dix-sept"),
    num(70, "soixante-dix"),
    num(77, "soixante-dix-sept"),
    num(3, "trois"),
    num(40, "quarante"),
  ];

  it("同じ種類から、まぎらわしい（一の位や十の位が同じ）ものを優先して3つ選ぶ", () => {
    const picked = pickDistractors(
      numbers[0],
      [...numbers, time("7:00", "sept heures")],
      3,
      () => 0,
    );
    expect(picked).toHaveLength(3);
    expect(picked).not.toContain("sept");
    expect(picked).not.toContain("sept heures");
    expect(new Set(picked)).toEqual(new Set(["dix-sept", "soixante-dix-sept", "trois"]));
  });

  it("時刻は、時か分が同じものを優先する", () => {
    const times = [
      time("7:30", "sept heures et demie"),
      time("8:30", "huit heures et demie"),
      time("7:15", "sept heures et quart"),
      time("2:00", "deux heures"),
      time("5:10", "cinq heures dix"),
    ];
    expect(new Set(pickDistractors(times[0], times, 2, () => 0))).toEqual(
      new Set(["huit heures et demie", "sept heures et quart"]),
    );
  });

  it("正解と同じつづりや重複は選ばない", () => {
    const items = [num(1, "un"), num(11, "onze"), num(21, "onze"), num(31, "un")];
    expect(pickDistractors(items[0], items, 3, () => 0)).toEqual(["onze"]);
  });
});

describe("matchesAnyAnswer", () => {
  it("正解・別の言い方のどれかと、大文字小文字・前後と連続する空白を無視して一致すれば正解", () => {
    const item = {
      ...time("7:30", "halb acht"),
      alternatives: ["sieben Uhr dreißig"],
    };
    expect(matchesAnyAnswer(" Halb  acht ", item)).toBe(true);
    expect(matchesAnyAnswer("sieben uhr dreißig", item)).toBe(true);
    expect(matchesAnyAnswer("halb sieben", item)).toBe(false);
  });
});

describe("buildNumberPracticeItems", () => {
  it("数字と時刻をまとめ、時刻は先頭の言い方を正解・残りを別の言い方にする", () => {
    expect(
      buildNumberPracticeItems(
        [{ num: 21, spelling: "vingt et un" }],
        [{ time: "7:30", answers: ["halb acht", "sieben Uhr dreißig"], note: "" }],
      ),
    ).toEqual([
      {
        id: "number-21-0",
        kind: "number",
        prompt: "21",
        value: 21,
        answer: "vingt et un",
        alternatives: [],
      },
      {
        id: "time-7:30-0",
        kind: "time",
        prompt: "7:30",
        value: 450,
        answer: "halb acht",
        alternatives: ["sieben Uhr dreißig"],
        note: undefined,
        explanation: "ほかの言い方: sieben Uhr dreißig",
      },
    ]);
  });
});
