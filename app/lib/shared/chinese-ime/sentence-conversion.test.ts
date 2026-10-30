import { describe, expect, it } from "vite-plus/test";

import { convertSentence, lookupCandidates } from "./dictionary";
import { segmentPinyin } from "./syllables";

function convertFromPinyin(pinyin: string): string | null {
  return convertSentence(pinyin);
}

describe("Sentence-level Chinese Pinyin conversion", () => {
  it("日常会話・中検3級の典型的な文を文単位で正確に漢字変換できる", () => {
    const testCases: Array<{ pinyin: string; expected: string }> = [
      { pinyin: "nihao", expected: "你好" },
      { pinyin: "woshiribenren", expected: "我是日本人" },
      { pinyin: "woxuexihanyu", expected: "我学习汉语" },
      { pinyin: "tahengaoxing", expected: "他很高兴" },
      { pinyin: "jintiantianqihenhao", expected: "今天天气很好" },
      { pinyin: "mingtianwoqubeijing", expected: "明天我去北京" },
      { pinyin: "nixihuanhekafeima", expected: "你喜欢喝咖啡吗" },
      { pinyin: "duibuqimeiguanxi", expected: "对不起没关系" },
      { pinyin: "xiexieni", expected: "谢谢你" },
      { pinyin: "womenyiqichifanba", expected: "我们一起吃饭吧" },
    ];

    for (const { pinyin, expected } of testCases) {
      const converted = convertFromPinyin(pinyin);
      expect(converted, `Failed for pinyin: ${pinyin}`).toBe(expected);
    }
  });

  it("アポストロフィを含む文も正しく変換できる（xi'an）", () => {
    const converted = convertFromPinyin("xi'an");
    // 西安
    expect(converted).toBe("西安");
  });

  it("lookupCandidates で文変換候補が先頭に来る", () => {
    const segments = segmentPinyin("woxuexihanyu")!;
    const candidates = lookupCandidates(segments.map((s) => s.text));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].text).toBe("我学习汉语");
    expect(candidates[0].kind).toBe("sentence");
    expect(candidates[0].syllableCount).toBe(5);
  });
});
