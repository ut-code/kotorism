import { describe, expect, it } from "vite-plus/test";

import { getCharCandidates, getWordCandidates, lookupCandidates } from "./dictionary";

describe("dictionary lookup", () => {
  it("1字辞書を引くと頻度順に漢字が並ぶ", () => {
    const ni = getCharCandidates("ni");
    expect(ni.length).toBeGreaterThan(0);
    // 最初の候補は「你」
    expect(ni[0].text).toBe("你");
    // 頻度降順になっている
    for (let i = 1; i < ni.length; i++) {
      expect(ni[i - 1].weight).toBeGreaterThanOrEqual(ni[i].weight);
    }
  });

  it("単語辞書を引ける（nihao → 你好, zhongguo → 中国）", () => {
    const nihao = getWordCandidates(["ni", "hao"]);
    expect(nihao.map((c) => c.text)).toContain("你好");

    const zhongguo = getWordCandidates(["zhong", "guo"]);
    expect(zhongguo.map((c) => c.text)).toContain("中国");
  });

  it("中検3級・大学第2外国語レベルの主要語彙が含まれている", () => {
    const testCases: Array<{ syllables: string[]; expected: string }> = [
      { syllables: ["xue", "xi"], expected: "学习" },
      { syllables: ["xie", "xie"], expected: "谢谢" },
      { syllables: ["dui", "bu", "qi"], expected: "对不起" },
      { syllables: ["mei", "guan", "xi"], expected: "没关系" },
      { syllables: ["shen", "me"], expected: "什么" },
      { syllables: ["zen", "me", "yang"], expected: "怎么样" },
      { syllables: ["wei", "shen", "me"], expected: "为什么" },
      { syllables: ["yin", "wei"], expected: "因为" },
      { syllables: ["suo", "yi"], expected: "所以" },
      { syllables: ["xi", "huan"], expected: "喜欢" },
      { syllables: ["ri", "ben"], expected: "日本" },
      { syllables: ["ming", "tian"], expected: "明天" },
      { syllables: ["xian", "zai"], expected: "现在" },
      { syllables: ["peng", "you"], expected: "朋友" },
      { syllables: ["lao", "shi"], expected: "老师" },
      { syllables: ["xue", "sheng"], expected: "学生" },
    ];

    for (const { syllables, expected } of testCases) {
      const candidates = getWordCandidates(syllables);
      expect(
        candidates.map((c) => c.text),
        `missing ${expected} for ${syllables.join(" ")}`,
      ).toContain(expected);
    }
  });

  it("lookupCandidates は最長一致単語、続けて1字候補を返す", () => {
    const result = lookupCandidates(["ni", "hao"]);
    // 最初の候補は最長一致単語「你好」
    expect(result[0].text).toBe("你好");
    expect(result[0].syllableCount).toBe(2);

    // 続けて1字の候補（先頭音節 ni の候補）が並ぶ
    const charResults = result.filter((c) => c.syllableCount === 1);
    expect(charResults.length).toBeGreaterThan(0);
    expect(charResults[0].text).toBe("你");
  });
});
