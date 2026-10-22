// My単語帳のクイズで、Excelテンプレート（/my-notebooks/template?language=...）の列のまま
// 使っている単語帳にだけ付ける補助。答え合わせで見出し語を読み上げて発音を聞かせ、
// 中国語で拼音を答えるときは意味をヒントとして出す

import type { NotebookLanguage } from "@/lib/shared/notebook-language";

// 各言語のテンプレートの1行目。テンプレートのダウンロードと共有する
export const NOTEBOOK_TEMPLATE_COLUMNS = {
  英語: ["単語", "意味"],
  ドイツ語: ["単語", "意味", "性", "複数形", "格・前置詞"],
  中国語: ["単語", "意味", "拼音"],
  フランス語: ["単語", "意味", "性", "格・前置詞"],
  スペイン語: ["単語", "意味", "性", "格・前置詞"],
} as const satisfies Record<string, readonly string[]>;

export type TemplateLanguage = keyof typeof NOTEBOOK_TEMPLATE_COLUMNS;

// 読み上げに使う言語（BCP47タグ）
const SPEECH_LANGS: Record<TemplateLanguage, string> = {
  英語: "en-US",
  ドイツ語: "de-DE",
  中国語: "zh-CN",
  フランス語: "fr-FR",
  スペイン語: "es-ES",
};

const NOTEBOOK_LANGUAGE_TEMPLATES: Record<NotebookLanguage, TemplateLanguage> = {
  french: "フランス語",
  german: "ドイツ語",
  spanish: "スペイン語",
  chinese: "中国語",
};

export type QuizSupport = {
  // 正解と同じ組から出すヒントの列。出さなければ null
  hintColumn: string | null;
  // 答え合わせで見出し語を読み上げる言語
  speechLang: string;
};

const startsWith = (columns: readonly string[], prefix: readonly string[]) =>
  prefix.every((name, i) => columns[i] === name);

// 列の先頭がいちばん長く一致するテンプレートの言語（後ろに列を足すのは構わない）。
// 一致するテンプレートが複数（列が同じフランス語とスペイン語）なら決められないので null
function templateLanguageOf(columns: readonly string[]): TemplateLanguage | null {
  const matches = (Object.keys(NOTEBOOK_TEMPLATE_COLUMNS) as TemplateLanguage[]).filter(
    (language) => startsWith(columns, NOTEBOOK_TEMPLATE_COLUMNS[language]),
  );
  const longest = Math.max(0, ...matches.map((l) => NOTEBOOK_TEMPLATE_COLUMNS[l].length));
  const candidates = matches.filter((l) => NOTEBOOK_TEMPLATE_COLUMNS[l].length === longest);
  return candidates.length === 1 ? candidates[0] : null;
}

// テンプレートの形式の単語帳で、意味（全言語）か拼音（中国語）を答えるときだけ補助を返す。
// 意味を答えるときの読み上げの言語は、単語帳の言語を選んでいればそれ、無ければテンプレートの列から決める
export function quizSupport(
  columns: readonly string[],
  answerColumn: string,
  language: NotebookLanguage | null,
): QuizSupport | null {
  const [, meaning, pinyin] = NOTEBOOK_TEMPLATE_COLUMNS.中国語;

  if (answerColumn === pinyin) {
    if (!startsWith(columns, NOTEBOOK_TEMPLATE_COLUMNS.中国語)) return null;
    return { hintColumn: meaning, speechLang: SPEECH_LANGS.中国語 };
  }

  if (answerColumn === meaning) {
    if (!startsWith(columns, NOTEBOOK_TEMPLATE_COLUMNS.英語)) return null;
    const template = language ? NOTEBOOK_LANGUAGE_TEMPLATES[language] : templateLanguageOf(columns);
    if (!template) return null;
    return { hintColumn: null, speechLang: SPEECH_LANGS[template] };
  }

  return null;
}

// 正解と同じ組（行）にある、ヒントの列の値を重複なくつなげる
export function quizHint(
  rows: Record<string, string>[],
  answerColumn: string,
  answer: string,
  hintColumn: string,
): string {
  const hints = rows
    .filter((row) => row[answerColumn] === answer)
    .map((row) => row[hintColumn])
    .filter(Boolean);
  return [...new Set(hints)].join("、");
}
