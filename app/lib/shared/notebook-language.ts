// My単語帳の言語と、単語を入力するときの補助（アクセント記号・ピンイン・ピンインからの簡体字の変換）。
// 言語は学習教材にある4言語から選び、それ以外（英語など）は指定なし（null）として補助を出さない

export const NOTEBOOK_LANGUAGES = ["french", "german", "spanish", "chinese"] as const;
export type NotebookLanguage = (typeof NOTEBOOK_LANGUAGES)[number];

export const NOTEBOOK_LANGUAGE_LABELS: Record<NotebookLanguage, string> = {
  french: "フランス語",
  german: "ドイツ語",
  spanish: "スペイン語",
  chinese: "中国語",
};

// DB の値などを単語帳の言語にする。4言語以外は指定なし
export function normalizeNotebookLanguage(value: unknown): NotebookLanguage | null {
  return NOTEBOOK_LANGUAGES.find((language) => language === value) ?? null;
}

// 入力欄の補助。accent: ↑↓・ボタンでアクセント記号付きの文字、pinyin: ↑↓・ボタンで声調記号付きの母音、
// hanzi: ピンインを打って簡体字に変換する、off: 補助なし
export type InputAssistMode = "accent" | "pinyin" | "hanzi" | "off";

export const INPUT_ASSIST_LABELS: Record<InputAssistMode, string> = {
  accent: "補助あり",
  pinyin: "ピンイン",
  hanzi: "簡体字",
  off: "補助なし",
};

// その言語の列で選べる補助（先頭ほどよく使うもの）
export function assistModeChoices(language: NotebookLanguage | null): InputAssistMode[] {
  if (language === null) return [];
  if (language === "chinese") return ["hanzi", "pinyin", "off"];
  return ["accent", "off"];
}

// ピンインを書く列か（列名で見分ける）
export function isPinyinColumn(columnName: string): boolean {
  return /拼音|ピンイン|pinyin/i.test(columnName);
}

// 列の補助。選んだもの（saved）がその言語で選べればそれを、選んでいなければ列から決める。
// 中国語は見出し語を簡体字、ピンインの列をピンインにし、意味などほかの列は補助なしにする
export function assistModeFor(
  language: NotebookLanguage | null,
  columnIndex: number,
  columnName: string,
  saved?: unknown,
): InputAssistMode {
  const choices = assistModeChoices(language);
  const chosen = choices.find((mode) => mode === saved);
  if (chosen) return chosen;
  if (language === null) return "off";
  if (language !== "chinese") return "accent";
  if (columnIndex === 0) return "hanzi";
  return isPinyinColumn(columnName) ? "pinyin" : "off";
}
