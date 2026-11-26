import { describe, expect, it } from "vite-plus/test";

import { splitAtPhraseBreaks } from "./phrase-breaks";

describe("splitAtPhraseBreaks", () => {
  it("「・」の後ろで区切り、「指示詞の表完成演習」は1つの塊のままにする", () => {
    expect(splitAtPhraseBreaks("人称代名詞・所有形容詞・冠詞・指示詞の表完成演習")).toEqual([
      "人称代名詞・",
      "所有形容詞・",
      "冠詞・",
      "指示詞の表完成演習",
    ]);
  });

  it("括弧の前後と空白の後ろで区切る", () => {
    expect(splitAtPhraseBreaks("文法クイズ（基本1）まとめ")).toEqual([
      "文法クイズ",
      "（基本1）",
      "まとめ",
    ]);
    expect(splitAtPhraseBreaks("数字 と 時刻")).toEqual(["数字 ", "と ", "時刻"]);
  });

  it("区切りが無ければそのまま1つの塊にする", () => {
    expect(splitAtPhraseBreaks("作文")).toEqual(["作文"]);
    expect(splitAtPhraseBreaks("")).toEqual([]);
  });
});
