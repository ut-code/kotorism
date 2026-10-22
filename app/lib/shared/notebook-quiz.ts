// My単語帳のクイズで、中国語のExcelテンプレート（/my-notebooks/template?language=中国語）の
// 列のまま使っている単語帳にだけ付ける補助。拼音を答えるときに、意味をヒントとして出し、
// 答え合わせで見出し語（簡体字）を中国語で読み上げて正しい発音を聞かせる

// 中国語テンプレートの1行目（見出し語・意味・拼音）。テンプレートのダウンロードと共有する
export const CHINESE_TEMPLATE_COLUMNS = ["単語", "意味", "拼音"] as const;

export type ChineseQuizSupport = { hintColumn: string; speechLang: "zh-CN" };

// 列の先頭3つがテンプレートと同じで、拼音の列を答えるときだけ補助を返す（後ろに列を足すのは構わない）
export function chineseQuizSupport(
  columns: string[],
  answerColumn: string,
): ChineseQuizSupport | null {
  const [, meaning, pinyin] = CHINESE_TEMPLATE_COLUMNS;
  const matchesTemplate = CHINESE_TEMPLATE_COLUMNS.every((name, i) => columns[i] === name);
  if (!matchesTemplate || answerColumn !== pinyin) return null;
  return { hintColumn: meaning, speechLang: "zh-CN" };
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
