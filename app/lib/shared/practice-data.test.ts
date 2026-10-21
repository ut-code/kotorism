import { describe, expect, it } from "vitest";

import {
  loadFillInItems,
  loadGrammarTables,
  loadNumberItems,
  loadTimeItems,
} from "@/components/practice/data";
import {
  parseFillInItems,
  parseGrammarTables,
  parseNumberItems,
  parseTimeItems,
} from "./practice-data";

describe("parseGrammarTables", () => {
  it("見出しごとに表を分け、連続する同じセルを結合し、Markdown エスケープを外す", () => {
    const source = [
      "### 人称代名詞",
      "| 主格 | 単数 | 複数 |",
      "| --- | --- | --- |",
      String.raw`| 1人称 | je | nous \_mêmes |`,
      "### 冠詞",
      "| 格 | 男性 | 女性 |",
      "| --- | --- | --- |",
      "| 1格 | der | die |",
    ].join("\n");

    expect(parseGrammarTables(source)).toEqual([
      {
        title: "人称代名詞",
        headers: ["主格", "単数", "複数"],
        rows: [
          {
            label: "1人称",
            cells: [
              { value: "je", colSpan: 1 },
              { value: "nous _mêmes", colSpan: 1 },
            ],
          },
        ],
      },
      {
        title: "冠詞",
        headers: ["格", "男性", "女性"],
        rows: [
          {
            label: "1格",
            cells: [
              { value: "der", colSpan: 1 },
              { value: "die", colSpan: 1 },
            ],
          },
        ],
      },
    ]);
  });

  it("見出しがなくても表を読み、同じ値の隣接セルをまとめる", () => {
    expect(
      parseGrammarTables(
        ["| 主格 | m | f | n |", "| --- | --- | --- | --- |", "| 1人称 | ich | ich | er |"].join(
          "\n",
        ),
      ),
    ).toEqual([
      {
        title: "文法表",
        headers: ["主格", "m", "f", "n"],
        rows: [
          {
            label: "1人称",
            cells: [
              { value: "ich", colSpan: 2 },
              { value: "er", colSpan: 1 },
            ],
          },
        ],
      },
    ]);
  });
});

describe("parseFillInItems", () => {
  it("見出しをカテゴリとして付け、表の問題・答え・任意の解説を読み取る", () => {
    const source = [
      "### 複合過去",
      "| 例文 (問題文) | 訳・ヒント | 正解 | 解説 |",
      "| --- | --- | --- | --- |",
      String.raw`| Je \_suis arrivé. | 私は着いた。 | suis | être の現在形 |`,
      "### 半過去",
      "| 例文 | 訳 | 正解 |",
      "| --- | --- | --- |",
      "| Nous parlions. | 私たちは話した。 | parlions |",
    ].join("\n");

    expect(parseFillInItems(source)).toEqual([
      {
        id: "q-1",
        category: "複合過去",
        sentence: "Je _suis arrivé.",
        translation: "私は着いた。",
        answer: "suis",
        explanation: "être の現在形",
        distractors: [],
      },
      {
        id: "q-2",
        category: "半過去",
        sentence: "Nous parlions.",
        translation: "私たちは話した。",
        answer: "parlions",
        explanation: undefined,
        distractors: [],
      },
    ]);
  });

  it("5列目の誤答を「 / 」で区切って読み取る（4択の選択肢に使う）", () => {
    const source = [
      "| 例文 (問題文) | 訳・ヒント | 正解 | 解説 | 誤答 |",
      "| --- | --- | --- | --- | --- |",
      String.raw`| Je \_ (regarder) un film. | 映画を見た。 | ai regardé | 複合過去 | regardais / regarde / regarderai |`,
    ].join("\n");
    expect(parseFillInItems(source)[0].distractors).toEqual(["regardais", "regarde", "regarderai"]);
  });
});

describe("parseTimeItems", () => {
  it("「時刻 | 言い方 | 補足」の行を読み、言い方は「 / 」で分ける", () => {
    expect(
      parseTimeItems(
        [
          "| 時刻 | 言い方 | 補足 |",
          "| --- | --- | --- |",
          "| 7:30 | sept heures et demie / sept heures trente | |",
          "| 12:00 | midi | 正午 |",
          "| 7 | sept | |",
        ].join("\n"),
      ),
    ).toEqual([
      { time: "7:30", answers: ["sept heures et demie", "sept heures trente"], note: "" },
      { time: "12:00", answers: ["midi"], note: "正午" },
    ]);
  });
});

describe("parseNumberItems", () => {
  it("数字とつづりの行だけを読み、見出し・ハイフン・非数字の行を除外する", () => {
    expect(
      parseNumberItems([
        ["| 数字 | フランス語 |", "| --- | --- |", "| 0 | zéro |", "| 1 | un |", "| 2 | - |"].join(
          "\n",
        ),
        ["| 10 | dix |", "| 1.5 | un et demi |", "| 11 | onze |"].join("\n"),
      ]),
    ).toEqual([
      { num: 0, spelling: "zéro" },
      { num: 1, spelling: "un" },
      { num: 10, spelling: "dix" },
      { num: 11, spelling: "onze" },
    ]);
  });
});

// 文法クイズ（紛らわしい表現）のセクション番号。フランス語は基本を2つに分けたぶん後ろにずれる
const FILL_IN_SECTION = { french: "07", spanish: "06" } as const;

describe("教材 MDX からの演習データ読み込み", () => {
  it.each(["french", "spanish"] as const)(
    "%s の文法クイズ（紛らわしい表現）は、どの問題にも正解と異なる誤答が3つある",
    (language) => {
      const items = loadFillInItems(language, FILL_IN_SECTION[language]);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.distractors, item.sentence).toHaveLength(3);
        expect(new Set([item.answer, ...item.distractors]).size, item.sentence).toBe(4);
      }
    },
  );

  it.each([
    ["french", ["複合過去", "c'est", "à と pour", "助動詞", "savoir と connaître"]],
    ["spanish", ["ser と estar", "線過去", "por と para", "hay と estar"]],
  ] as const)(
    "%s の文法クイズ（紛らわしい表現）は、紛らわしい組ごとの出題範囲に8問以上ある",
    (language, topics) => {
      const items = loadFillInItems(language, FILL_IN_SECTION[language]);
      const categories = [...new Set(items.map((item) => item.category))];
      expect(categories).toHaveLength(topics.length);
      for (const topic of topics) {
        const category = categories.find((c) => c.includes(topic));
        expect(category, topic).toBeDefined();
        expect(
          items.filter((item) => item.category === category).length,
          topic,
        ).toBeGreaterThanOrEqual(8);
      }
    },
  );

  it.each([
    ["french", "08"],
    ["german", "07"],
    ["spanish", "07"],
  ] as const)("%s の数字・時間表現の演習に、時刻の問題が12問以上ある", (language, section) => {
    const items = loadTimeItems(language, section);
    expect(items.length).toBeGreaterThanOrEqual(12);
    // 4択の正解どうしが重ならないよう、時刻も正解の言い方も重複させない
    expect(new Set(items.map((item) => item.time)).size).toBe(items.length);
    expect(new Set(items.map((item) => item.answers[0])).size).toBe(items.length);
  });

  it.each(["french", "german", "spanish"] as const)(
    "%s の表完成・数字・時間表現の演習に出題データがある",
    (language) => {
      expect(loadGrammarTables(language, "04").length).toBeGreaterThan(0);

      const numberItems = loadNumberItems(language);
      expect(numberItems.length).toBeGreaterThan(0);
      expect(
        numberItems.every(({ num, spelling }) => Number.isInteger(num) && spelling.length > 0),
      ).toBe(true);
    },
  );

  it.each(["french", "spanish"] as const)(
    "%s の穴埋め問題を MDX から正しく読み込む",
    (language) => {
      const fillInItems = loadFillInItems(language, FILL_IN_SECTION[language]);
      expect(fillInItems.length).toBeGreaterThan(0);
      expect(
        fillInItems.every(({ sentence, answer }) => sentence.length > 0 && answer.length > 0),
      ).toBe(true);
      expect(fillInItems.some(({ sentence }) => sentence.includes("\\_"))).toBe(false);
    },
  );
});
