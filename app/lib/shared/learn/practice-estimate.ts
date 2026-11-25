// 演習1回にかかる時間の目安。「練習を始める」の下と、セクション一覧のカードに出す。
// 選ぶより入力するほうが時間がかかるので、答え方ごとに1問あたりの秒数を変える

export type PracticeKind = "choice" | "typing";

const SECONDS_PER_QUESTION: Record<PracticeKind, number> = {
  choice: 10,
  typing: 20,
};

// セクション一覧のカードで目安を出すときの問題数（演習の問題数の初期値）
export const DEFAULT_ROUND_SIZE = 10;

// 目安の分数。1分未満でも「約1分」にする
export function estimateMinutes(questions: number, kind: PracticeKind): number {
  return Math.max(1, Math.round((questions * SECONDS_PER_QUESTION[kind]) / 60));
}

// セクション一覧のカードに出す「10問・約2分」
export function practiceEstimateLabel(kind: PracticeKind): string {
  return `${DEFAULT_ROUND_SIZE}問・約${estimateMinutes(DEFAULT_ROUND_SIZE, kind)}分`;
}
