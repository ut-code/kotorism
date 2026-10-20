// 「発音クイズ」の問題の型と、出題データの点検・選択肢の読み上げ文字列の取り出し
import { BLANK, type GrammarUnitDef } from "./grammar-quiz";

// 問題の形式。聞き取り＝読み上げた語の空欄に入るつづりを選ぶ、ルール＝発音のルールの知識を問う、
// 読み方＝語・句の正しい発音を選ぶ（選択肢を押すとその発音を読み上げる）
export type PronunciationKind = "listening" | "rule" | "reading";

export const PRONUNCIATION_KINDS: { id: PronunciationKind; label: string; sub: string }[] = [
  { id: "listening", label: "聞き取り", sub: "音を聞いてつづりを選ぶ" },
  { id: "rule", label: "ルール", sub: "発音のルールの知識" },
  { id: "reading", label: "読み方", sub: "語・句の発音を聞き比べる" },
];

// 発音クイズの問題。すべて選択肢4つの4択
export type PronunciationQuestion<U extends string = string> = {
  kind: PronunciationKind;
  id: string;
  units: U[];
  // 問題文（聞き取り: 空欄入りの語 / ルール: 日本語の問い / 読み方: 発音を問う語・句）
  prompt: string;
  // 聞き取りで読み上げる語（空欄に正解を入れた語）
  speech?: string;
  // 問題文に添える補足（語の意味など）
  note?: string;
  choices: string[];
  // 読み方: choices と同じ順の、各選択肢の発音を読み上げるための文字列。
  // 誤った発音は、その音になるようフランス語のつづりで書き直したもの（例: [bun] → "boune"）
  choiceSpeech?: string[];
  // 正解の選択肢
  answer: string;
  explanation: string;
};

// 読み方の問題で、選択肢の発音を読み上げる文字列。読み上げを持たない問題・選択肢では undefined
export function speechForChoice(
  question: PronunciationQuestion,
  choice: string,
): string | undefined {
  const index = question.choices.indexOf(choice);
  return index < 0 ? undefined : question.choiceSpeech?.[index];
}

// 出題データの不備を1件ずつ説明文で返す
export function findPronunciationProblems(
  questions: PronunciationQuestion[],
  units: readonly GrammarUnitDef[],
): string[] {
  const unitIds = new Set(units.map((u) => u.id));
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) problems.push(`${q.id}: id が重複しています`);
    seen.add(q.id);
    if (!q.explanation.trim()) problems.push(`${q.id}: 解説がありません`);
    if (q.units.length === 0) problems.push(`${q.id}: 単元タグがありません`);
    else if (q.units.some((u) => !unitIds.has(u)))
      problems.push(`${q.id}: 知らない単元タグがあります`);

    if (q.choices.length !== 4) problems.push(`${q.id}: 選択肢が4つではありません`);
    else if (new Set(q.choices).size !== q.choices.length)
      problems.push(`${q.id}: 選択肢が重複しています`);
    else if (!q.choices.includes(q.answer)) problems.push(`${q.id}: 正解が選択肢にありません`);

    if (q.kind === "listening") {
      if (!q.speech) problems.push(`${q.id}: 読み上げる語がありません`);
      else if (q.prompt.split(BLANK).length !== 2)
        problems.push(`${q.id}: 空欄がちょうど1つではありません`);
      else if (q.prompt.replace(BLANK, q.answer) !== q.speech)
        problems.push(`${q.id}: 空欄に正解を入れても読み上げる語になりません`);
    } else if (q.kind === "reading") {
      const speech = q.choiceSpeech ?? [];
      if (speech.length !== q.choices.length)
        problems.push(`${q.id}: 選択肢の読み上げが選択肢と同じ数ではありません`);
      else if (new Set(speech).size !== speech.length)
        problems.push(`${q.id}: 選択肢の読み上げが重複しています`);
      else if (speechForChoice(q, q.answer) !== q.prompt)
        problems.push(`${q.id}: 正解の選択肢が問題の語そのものを読み上げません`);
    } else if (q.speech || q.choiceSpeech) {
      problems.push(`${q.id}: ルールの問題に読み上げがあります`);
    }
  }
  return problems;
}
