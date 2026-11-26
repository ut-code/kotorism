// /learn/[language] のセクション一覧のカードに小さく出す進み具合。
// 記録しているのは「開いたことがあるか」（SectionView）と、クイズ形式のセクションの通算の正解数・回答数
// （SectionProgress）だけなので、前回1回分の点数は出せない。通算の正解数を出す
export type SectionCardStatus =
  | { kind: "new" }
  | { kind: "started" }
  | { kind: "quiz"; correct: number; attempts: number };

export function sectionCardStatus({
  viewed,
  attemptCount,
  correctCount,
}: {
  viewed: boolean;
  attemptCount: number;
  correctCount: number;
}): SectionCardStatus {
  if (attemptCount > 0) {
    return { kind: "quiz", correct: Math.min(correctCount, attemptCount), attempts: attemptCount };
  }
  return viewed ? { kind: "started" } : { kind: "new" };
}

export function sectionCardStatusLabel(status: SectionCardStatus): string {
  switch (status.kind) {
    case "new":
      return "未着手";
    case "started":
      return "取り組んだ";
    case "quiz":
      return `正解 ${status.correct}/${status.attempts}`;
  }
}
