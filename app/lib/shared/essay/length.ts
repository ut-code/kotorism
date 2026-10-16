// 作文の分量の数え方は言語によって異なる。
// 中国語は1文字ごとに意味を持つため「字数」（文字数）で数え、
// フランス語・ドイツ語・スペイン語のような分かち書きの言語は「語数」（単語数）で数える。

export type EssayLengthUnit = "characters" | "words";

const LANGUAGE_LENGTH_UNIT: Record<string, EssayLengthUnit> = {
  chinese: "characters",
  french: "words",
  german: "words",
  spanish: "words",
};

export function getEssayLengthUnit(language: string): EssayLengthUnit {
  return LANGUAGE_LENGTH_UNIT[language] ?? "words";
}

// 表示・お題の目安に使う単位のラベル（例: "40字" / "40語"）
export function essayLengthUnitLabel(unit: EssayLengthUnit): string {
  return unit === "characters" ? "字" : "語";
}

// 「字数目安」「語数目安」のような見出し用の言い回し
export function essayLengthGuideLabel(unit: EssayLengthUnit): string {
  return unit === "characters" ? "字数目安" : "語数目安";
}

// 実際に書かれた作文の分量を、言語ごとの数え方で数える
export function countEssayLength(text: string, unit: EssayLengthUnit): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (unit === "characters") {
    return Array.from(trimmed.replace(/\s/g, "")).length;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}
