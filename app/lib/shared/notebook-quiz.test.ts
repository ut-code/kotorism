import { describe, expect, it } from "vitest";

import {
  NOTEBOOK_TEMPLATE_COLUMNS,
  quizHint,
  quizSupport,
  quizTargetCards,
  toggleQuizStar,
} from "./notebook-quiz";

const { 英語, ドイツ語, 中国語, フランス語, スペイン語 } = NOTEBOOK_TEMPLATE_COLUMNS;

describe("quizSupport: 拼音を答えるとき", () => {
  it("中国語のテンプレートの列なら、意味をヒントにし、見出し語を中国語で読み上げる", () => {
    expect(quizSupport(中国語, "拼音", null)).toEqual({
      hintColumn: "意味",
      rubyColumn: null,
      speechLang: "zh-CN",
      speakOn: "answer",
    });
  });

  it("テンプレートの後ろに列を足していても使える", () => {
    expect(quizSupport([...中国語, "例文"], "拼音", null)).not.toBeNull();
  });

  it("1行目が中国語のテンプレートと違う単語帳では使わない", () => {
    expect(quizSupport(["見出し語", "意味", "拼音"], "拼音", "chinese")).toBeNull();
    expect(quizSupport(["単語", "拼音", "意味"], "拼音", "chinese")).toBeNull();
  });
});

describe("quizSupport: 意味を答えるとき", () => {
  it("テンプレートの列から言語を決めて、出題したときに見出し語を読み上げる（ヒントは出さない）", () => {
    expect(quizSupport(英語, "意味", null)).toEqual({
      hintColumn: null,
      rubyColumn: null,
      speechLang: "en-US",
      speakOn: "question",
    });
    expect(quizSupport(ドイツ語, "意味", null)?.speechLang).toBe("de-DE");
    expect(quizSupport(中国語, "意味", null)?.speechLang).toBe("zh-CN");
  });

  it("中国語のテンプレートなら、拼音を見出し語の上に出す", () => {
    expect(quizSupport(中国語, "意味", null)?.rubyColumn).toBe("拼音");
    expect(quizSupport(中国語, "意味", "chinese")?.rubyColumn).toBe("拼音");
  });

  it("中国語でも拼音の列が無ければ、見出し語の上には何も出さない", () => {
    expect(quizSupport(英語, "意味", "chinese")).toMatchObject({
      rubyColumn: null,
      speechLang: "zh-CN",
    });
  });

  it("中国語以外では、見出し語の上には何も出さない", () => {
    expect(quizSupport(ドイツ語, "意味", null)?.rubyColumn).toBeNull();
  });

  it("単語帳の言語を選んでいれば、その言語で読み上げる", () => {
    expect(quizSupport(フランス語, "意味", "french")?.speechLang).toBe("fr-FR");
    expect(quizSupport(スペイン語, "意味", "spanish")?.speechLang).toBe("es-ES");
    expect(quizSupport(英語, "意味", "german")?.speechLang).toBe("de-DE");
  });

  it("フランス語とスペイン語のテンプレートは列が同じなので、言語を選んでいなければ読み上げない", () => {
    expect(quizSupport(フランス語, "意味", null)).toBeNull();
  });

  it("1行目が「単語・意味」で始まらない単語帳では使わない", () => {
    expect(quizSupport(["見出し語", "意味"], "意味", "french")).toBeNull();
  });

  it("意味・拼音以外の列を答えるときは使わない", () => {
    expect(quizSupport(ドイツ語, "性", "german")).toBeNull();
  });
});

describe("quizHint", () => {
  const rows = [
    { 意味: "夫", 拼音: "zhàngfu" },
    { 意味: "一人前の男", 拼音: "zhàngfū" },
    { 意味: "おっと", 拼音: "zhàngfu" },
  ];

  it("正解と同じ組のヒントの列の値を、重複なく「、」でつなぐ", () => {
    expect(quizHint(rows, "拼音", "zhàngfu", "意味")).toBe("夫、おっと");
  });

  it("ヒントの値が無ければ空文字", () => {
    expect(quizHint([{ 拼音: "lìzi" }], "拼音", "lìzi", "意味")).toBe("");
  });
});

describe("toggleQuizStar", () => {
  it("★が無ければ★をつけ、つけた回数を1増やす", () => {
    expect(toggleQuizStar({ starred: false, starCount: 0 })).toEqual({
      starred: true,
      starCount: 1,
    });
    expect(toggleQuizStar({ starred: false, starCount: 2 })).toEqual({
      starred: true,
      starCount: 3,
    });
  });

  it("★があれば外す（つけた回数はそのまま）", () => {
    expect(toggleQuizStar({ starred: true, starCount: 2 })).toEqual({
      starred: false,
      starCount: 2,
    });
  });
});

describe("quizTargetCards", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const stars = {
    a: { starred: true, starCount: 1 },
    b: { starred: false, starCount: 1 },
  };

  it("すべてなら、全ての単語を出題する", () => {
    expect(quizTargetCards(cards, "all", stars)).toEqual(cards);
  });

  it("★つきなら、いま★のついた単語だけを出題する", () => {
    expect(quizTargetCards(cards, "starred", stars)).toEqual([{ id: "a" }]);
  });
});
