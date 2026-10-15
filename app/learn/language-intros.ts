// 学習教材の言語一覧（/learn）で、各言語のカードに添える紹介
export type LanguageIntro = {
  // その言語自身での名前
  nativeName: string;
  // その言語での「こんにちは」と、読み方（ラテン文字で書かない言語のみ）
  greeting: string;
  greetingReading?: string;
  // 言語の特徴（1〜2文）
  description: string;
};

export const LANGUAGE_INTROS: Record<string, LanguageIntro> = {
  chinese: {
    nativeName: "中文",
    greeting: "你好",
    greetingReading: "nǐ hǎo",
    description:
      "漢字で書き、声調（音の高低の変化）で意味を区別する言語です。日本語と共通する漢字が多く、文字から意味を推測しやすいのが魅力です。",
  },
  french: {
    nativeName: "Français",
    greeting: "Bonjour",
    description:
      "なめらかな響きと、単語をつなげて読むリエゾンが特徴の言語です。名詞に男性・女性の区別があり、ヨーロッパやアフリカの多くの国で話されています。",
  },
  german: {
    nativeName: "Deutsch",
    greeting: "Hallo",
    description:
      "名詞に3つの性と4つの格があり、文法がとても体系的な言語です。つづりと発音の対応が規則的なので、読み方を覚えやすいのも特徴です。",
  },
  spanish: {
    nativeName: "Español",
    greeting: "Hola",
    description:
      "20を超える国で公用語として話される、世界で広く使われる言語です。ほぼつづりどおりに読め、母音が日本語と同じ5つなので発音しやすいのが魅力です。",
  },
};
