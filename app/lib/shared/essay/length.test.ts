import { describe, expect, it } from "vitest";

import {
  countEssayLength,
  essayLengthGuideLabel,
  essayLengthUnitLabel,
  getEssayLengthUnit,
} from "./length";

describe("getEssayLengthUnit", () => {
  it("中国語は字数、分かち書きの言語と未知の言語は語数", () => {
    expect(getEssayLengthUnit("chinese")).toBe("characters");
    expect(getEssayLengthUnit("french")).toBe("words");
    expect(getEssayLengthUnit("german")).toBe("words");
    expect(getEssayLengthUnit("spanish")).toBe("words");
    expect(getEssayLengthUnit("klingon")).toBe("words");
  });
});

describe("ラベル", () => {
  it("単位ごとの表記を返す", () => {
    expect(essayLengthUnitLabel("characters")).toBe("字");
    expect(essayLengthUnitLabel("words")).toBe("語");
    expect(essayLengthGuideLabel("characters")).toBe("字数目安");
    expect(essayLengthGuideLabel("words")).toBe("語数目安");
  });
});

describe("countEssayLength", () => {
  it("空白だけ・空文字は 0", () => {
    expect(countEssayLength("", "words")).toBe(0);
    expect(countEssayLength("  \n\t ", "characters")).toBe(0);
  });

  it("字数は空白を除いて数え、サロゲートペアも 1 字と数える", () => {
    expect(countEssayLength("我 爱 你", "characters")).toBe(3);
    expect(countEssayLength("𠮷野家", "characters")).toBe(3);
  });

  it("語数は連続する空白・改行で区切って数える", () => {
    expect(countEssayLength("  Je  suis\n étudiant ", "words")).toBe(3);
  });
});
