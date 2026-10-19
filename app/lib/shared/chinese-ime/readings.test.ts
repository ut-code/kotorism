import { pinyin } from "pinyin";
import { describe, expect, it } from "vitest";

import { CHAR_DICT } from "./dict/chars";
import { CHAR_READINGS } from "./dict/readings";
import { WORD_DICT } from "./dict/words";

// 辞書に出てくる漢字（1字辞書・単語辞書のすべての字）
const dictionaryChars = [
  ...new Set(
    [...Object.values(CHAR_DICT), ...Object.values(WORD_DICT)].flatMap((entries) =>
      entries.flatMap((entry) => [...entry.text]),
    ),
  ),
].sort();

// 声調の並べ替えに使う読みの表は、pinyin パッケージをブラウザに読み込まずに済むよう前もって作っておく。
// 辞書を変えたら `npx jiti scripts/generate-chinese-ime-readings.ts` で作り直す
describe("漢字の読みの表", () => {
  it("辞書のすべての字について、pinyin パッケージと同じ読みを持つ", () => {
    const expected = Object.fromEntries(
      dictionaryChars.map((char) => [
        char,
        (pinyin(char, { heteronym: true, style: pinyin.STYLE_TONE2 })[0] ?? []).join(" "),
      ]),
    );
    expect(CHAR_READINGS).toEqual(expected);
  });
});
