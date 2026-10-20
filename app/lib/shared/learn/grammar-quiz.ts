// 各言語の「文法クイズ」の問題の型と、単元での絞り込み・出題データの点検。
// 単元の定義と出題データは言語ごとに、各セクションのフォルダの quiz-data.ts に置く

// 穴埋め問題の空欄
export const BLANK = "＿＿";

// 出題の単元。問題には units で1つ以上の単元タグを付け、学習者は単元を選んで出題範囲を絞る
export type GrammarUnitDef = { id: string; label: string; sub?: string };

// 4択の観点。意味＝学ぶ言語の文の訳を選ぶ、形＝日本語に合う学ぶ言語の形を選ぶ、
// 文脈＝会話の流れに合う表現を選ぶ、穴埋め＝日本語訳を手がかりに文の空欄に入る語を選ぶ
export type ChoiceFocus = "meaning" | "form" | "context" | "blank";

// 空欄（BLANK）を1つ含む問題文を使う観点
const BLANK_FOCUSES: ReadonlySet<ChoiceFocus> = new Set(["context", "blank"]);

// 文法クイズの問題。すべて選択肢4つの4択
// U は単元タグの型（言語ごとの単元 id の和集合にすると、タグの書き間違いを型で防げる）
export type GrammarQuestion<U extends string = string> = {
  focus: ChoiceFocus;
  id: string;
  units: U[];
  // 問題文（意味: 学ぶ言語の文 / 形: 日本語文 / 文脈: 空欄入りの会話 / 穴埋め: 空欄入りの文）
  prompt: string;
  // 問題文に添える補足（文脈: 場面説明 / 穴埋め: 文の日本語訳）
  note?: string;
  choices: string[];
  // 正解の選択肢の文
  answer: string;
  explanation: string;
};

// 選んだ単元のどれかが付いた問題だけを返す（何も選んでいなければ空）
export function filterByUnits<Q extends { units: readonly string[] }>(
  questions: Q[],
  selected: ReadonlySet<string>,
): Q[] {
  return questions.filter((q) => q.units.some((u) => selected.has(u)));
}

// 出題データの不備（解説が空、選択肢の数・重複、空欄の数など）を1件ずつ説明文で返す
export function findQuestionProblems(
  questions: GrammarQuestion[],
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
    else if (new Set(q.units).size !== q.units.length)
      problems.push(`${q.id}: 単元タグが重複しています`);

    if (q.choices.length !== 4) problems.push(`${q.id}: 選択肢が4つではありません`);
    else if (new Set(q.choices).size !== q.choices.length)
      problems.push(`${q.id}: 選択肢が重複しています`);
    else if (!q.choices.includes(q.answer)) problems.push(`${q.id}: 正解が選択肢にありません`);
    if (BLANK_FOCUSES.has(q.focus) && q.prompt.split(BLANK).length !== 2)
      problems.push(`${q.id}: 空欄がちょうど1つではありません`);
    if (q.focus === "blank" && !q.note?.trim()) problems.push(`${q.id}: 日本語訳がありません`);
  }
  return problems;
}
