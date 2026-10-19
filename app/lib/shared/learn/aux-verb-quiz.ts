// 中国語「助動詞の否定表現クイズ」の問題の型と、答え合わせ・出題データの点検

// 穴埋め問題の空欄
export const BLANK = "＿＿";

// 4択の観点。意味＝中国語文の訳を選ぶ、形＝日本語に合う中国語の形を選ぶ、文脈＝会話の流れに合う否定表現を選ぶ
export type ChoiceFocus = "meaning" | "form" | "context";

export type AuxVerbQuestion =
  | {
      kind: "choice";
      focus: ChoiceFocus;
      id: string;
      // 問題文（意味: 中国語文 / 形: 日本語文 / 文脈: 空欄入りの中国語の会話）
      prompt: string;
      // 文脈問題の場面説明や訳など、問題文に添える補足
      note?: string;
      choices: string[];
      // 正解の選択肢の文
      answer: string;
      explanation: string;
    }
  | {
      kind: "fill";
      id: string;
      // 空欄（BLANK）を1つ含む中国語の文
      sentence: string;
      // 文の日本語訳（何を入れるかの手がかり）
      translation: string;
      // 空欄に入る語（漢字）とそのピンイン。どちらで答えても正解
      answer: string;
      pinyin: string;
      explanation: string;
    };

const PINYIN_TONE_MARKS = /[̀-ͯ]/g;
// 句読点・記号・空白（全角を含む）
const IGNORED = /[\s\p{P}\p{S}0-9]/gu;

// 入力の表記ゆれをならす。空白・句読点・声調記号/番号を取り除き、全角英字を半角に、ü を v にそろえる
export function normalizeChineseAnswer(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/ü/g, "v")
    .replace(PINYIN_TONE_MARKS, "")
    .replace(IGNORED, "");
}

// 穴埋めの答え合わせ。漢字でもピンイン（声調記号は省略可）でも正解にする
export function isFillInCorrect(
  given: string,
  question: { answer: string; pinyin: string },
): boolean {
  const g = normalizeChineseAnswer(given);
  if (!g) return false;
  return [question.answer, question.pinyin].some((a) => normalizeChineseAnswer(a) === g);
}

// 出題データの不備（解説が空、選択肢の数・重複、空欄の数など）を1件ずつ説明文で返す
export function findQuestionProblems(questions: AuxVerbQuestion[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) problems.push(`${q.id}: id が重複しています`);
    seen.add(q.id);
    if (!q.explanation.trim()) problems.push(`${q.id}: 解説がありません`);

    if (q.kind === "choice") {
      if (q.choices.length !== 4) problems.push(`${q.id}: 選択肢が4つではありません`);
      else if (new Set(q.choices).size !== q.choices.length)
        problems.push(`${q.id}: 選択肢が重複しています`);
      else if (!q.choices.includes(q.answer)) problems.push(`${q.id}: 正解が選択肢にありません`);
    } else {
      if (q.sentence.split(BLANK).length !== 2)
        problems.push(`${q.id}: 空欄がちょうど1つではありません`);
      if (!q.answer.trim() || !q.pinyin.trim()) problems.push(`${q.id}: 正解かピンインが空です`);
    }
  }
  return problems;
}
