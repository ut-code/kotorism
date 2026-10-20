// 表完成・穴埋め・数字タイピング・作文・翻訳の演習で、言語ごとに変わる部分（特殊文字・言語名）の設定

export type PracticeLanguageSlug = "french" | "german" | "spanish";

export type PracticeLanguage = {
  label: string;
  // HTML の lang 属性
  lang: string;
  // ↑ / ↓ キーで切り替える文字の並び（小文字。大文字は自動で対応する）
  accentCycles: string[][];
  // ボタンで直接入力できる特殊文字
  specialChars: string[];
  // 操作の案内に出す、特殊文字の呼び方と例
  accentName: string;
};

export const PRACTICE_LANGUAGES: Record<PracticeLanguageSlug, PracticeLanguage> = {
  french: {
    label: "フランス語",
    lang: "fr",
    accentCycles: [
      ["e", "é", "è", "ê", "ë"],
      ["a", "à", "â"],
      ["i", "î", "ï"],
      ["o", "ô"],
      ["u", "ù", "û", "ü"],
      ["c", "ç"],
      ["y", "ÿ"],
    ],
    specialChars: ["à", "â", "é", "è", "ê", "ë", "î", "ï", "ô", "ù", "û", "ü", "ç", "œ"],
    accentName: "アクセント記号（é, è, ê, à, ç など）",
  },
  german: {
    label: "ドイツ語",
    lang: "de",
    accentCycles: [
      ["a", "ä"],
      ["o", "ö"],
      ["u", "ü"],
      ["s", "ß"],
    ],
    specialChars: ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"],
    accentName: "ウムラウト・エスツェット（ä, ö, ü, ß）",
  },
  spanish: {
    label: "スペイン語",
    lang: "es",
    accentCycles: [
      ["a", "á"],
      ["e", "é"],
      ["i", "í"],
      ["o", "ó"],
      ["u", "ú", "ü"],
      ["n", "ñ"],
    ],
    specialChars: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"],
    accentName: "アクセント記号（á, é, í, ó, ú, ñ など）",
  },
};

// 言語の slug から設定を引く。特殊文字の設定がない言語（中国語など）は undefined
export function getPracticeLanguage(slug: string): PracticeLanguage | undefined {
  return Object.hasOwn(PRACTICE_LANGUAGES, slug)
    ? PRACTICE_LANGUAGES[slug as PracticeLanguageSlug]
    : undefined;
}
