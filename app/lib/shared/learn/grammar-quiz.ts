// 中国語「文法クイズ」の問題の型と、単元での絞り込み・出題データの点検

// 穴埋め問題の空欄
export const BLANK = "＿＿";

// 出題の単元。問題には units で1つ以上の単元タグを付け、学習者は単元を選んで出題範囲を絞る
export const GRAMMAR_UNITS = [
  { id: "aux-verb", label: "助動詞の否定", sub: "不想・不用・不会…" },
  { id: "negation", label: "否定表現", sub: "不・没・别" },
  { id: "aspect", label: "時相・アスペクト", sub: "了・着・过" },
  { id: "possibility", label: "可能表現", sub: "能・会・可以" },
  { id: "complement", label: "方向補語・結果補語", sub: "上来・完・懂…" },
  { id: "preposition", label: "介詞", sub: "在・对・给…" },
] as const;

export type GrammarUnit = (typeof GRAMMAR_UNITS)[number]["id"];

const UNIT_IDS = new Set<string>(GRAMMAR_UNITS.map((u) => u.id));

// 4択の観点。意味＝中国語文の訳を選ぶ、形＝日本語に合う中国語の形を選ぶ、
// 文脈＝会話の流れに合う表現を選ぶ、穴埋め＝日本語訳を手がかりに文の空欄に入る語を選ぶ
export type ChoiceFocus = "meaning" | "form" | "context" | "blank";

// 空欄（BLANK）を1つ含む問題文を使う観点
const BLANK_FOCUSES: ReadonlySet<ChoiceFocus> = new Set(["context", "blank"]);

// 文法クイズの問題。すべて選択肢4つの4択
export type GrammarQuestion = {
  focus: ChoiceFocus;
  id: string;
  units: GrammarUnit[];
  // 問題文（意味: 中国語文 / 形: 日本語文 / 文脈: 空欄入りの中国語の会話 / 穴埋め: 空欄入りの中国語の文）
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
export function findQuestionProblems(questions: GrammarQuestion[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) problems.push(`${q.id}: id が重複しています`);
    seen.add(q.id);
    if (!q.explanation.trim()) problems.push(`${q.id}: 解説がありません`);
    if (q.units.length === 0) problems.push(`${q.id}: 単元タグがありません`);
    else if (q.units.some((u) => !UNIT_IDS.has(u)))
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
