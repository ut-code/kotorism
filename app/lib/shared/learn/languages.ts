export type Language = {
  languageSlug: string;
  label: string;
};

export const LANGUAGES: Language[] = [
  { languageSlug: "chinese", label: "中国語" },
  { languageSlug: "french", label: "フランス語" },
  { languageSlug: "german", label: "ドイツ語" },
  { languageSlug: "spanish", label: "スペイン語" },
];

// URLパラメータから言語を取得し、一致する言語の配列を返す関数
export function getLanguage(languageSlug: string): Language | undefined {
  return LANGUAGES.find((language) => language.languageSlug === languageSlug);
}
