import { z } from "zod";

// 暗記学習・クイズの途中経過を sessionStorage に保存し、誤ってリロードしても続きから再開できるようにする。
// 保存したデータは、別のタブで単語帳が編集される・古い形式のまま残るなどで今の単語帳と合わないことがあるため、
// 読み戻すときに必ずここで検証してから使う

// 保存先のキー。単語帳ごと・画面ごとに分け、自分の単語帳と共有リンクの同じ単語帳も別々に持つ
export function deckProgressKey(
  kind: "study" | "review" | "quiz" | "share-study" | "share-quiz",
  notebookId: string,
): string {
  return `kotorism:progress:${kind}:${notebookId}`;
}

// ---- 暗記学習 ----

// 暗記学習の出題単位（見出し語1件の中の1組）を表すキー。並び順はこのキーで保存し、
// カードの追加・削除で添字がずれても、残っているカードの順番と現在位置を保てるようにする
export function studyUnitKey(cardId: string, rowIndex: number): string {
  return `${cardId}:${rowIndex}`;
}

const studyProgressSchema = z.object({
  order: z.array(z.string()),
  index: z.number().int().min(0),
  frontColumn: z.string().optional(),
});

export type StudyProgress = z.infer<typeof studyProgressSchema>;

// 保存した並び順（キー）を、今の出題単位（unitKeys）の添字の並びに戻す。
// - 今は無い出題単位は飛ばし、保存後に増えた出題単位は末尾に足す
// - 表示していた出題単位が消えていたら、保存した並びでその次に残っているものから再開する
// 保存データが壊れている・残っている出題単位が1つも無いときは null（最初から始める）
export function restoreStudyProgress(
  saved: unknown,
  unitKeys: string[],
): { order: number[]; index: number; frontColumn?: string } | null {
  const parsed = studyProgressSchema.safeParse(saved);
  if (!parsed.success) return null;
  const { order: savedOrder, index: savedIndex, frontColumn } = parsed.data;

  const indexByKey = new Map(unitKeys.map((key, i) => [key, i]));
  const order: number[] = [];
  const used = new Set<number>();
  // 保存した並びの savedIndex 番目以降で、最初に今も残っている出題単位の位置を、再開位置にする
  let resumeAt: number | null = null;
  savedOrder.forEach((key, position) => {
    const unitIndex = indexByKey.get(key);
    if (unitIndex === undefined || used.has(unitIndex)) return;
    if (resumeAt === null && position >= savedIndex) resumeAt = order.length;
    used.add(unitIndex);
    order.push(unitIndex);
  });
  if (order.length === 0) return null;
  for (let i = 0; i < unitKeys.length; i += 1) {
    if (!used.has(i)) order.push(i);
  }

  // 表示していた位置より後ろが全部消えていたら、残っている中の最後（保存した並びの範囲内）から再開する
  const index = resumeAt ?? used.size - 1;
  return { order, index, frontColumn };
}

// ---- クイズ ----

export const quizQuestionSchema = z.object({
  // 出題元の単語（Card.id）。回答を学習カレンダーに記録するのに使う
  cardId: z.string(),
  // 出題する見出し語
  head: z.string(),
  // 正解（選んだ列の値）
  answer: z.string(),
  // 正解と同じ組の、ヒントの列の値（中国語のテンプレートで拼音を答えるときの意味）。無ければ空文字
  hint: z.string(),
  // 正解と同じ組の、見出し語の上に出す列の値（中国語のテンプレートで意味を答えるときの拼音）。無ければ空文字
  ruby: z.string(),
  // 正解を含む選択肢（表示順にシャッフル済み）
  choices: z.array(z.string()),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

const quizProgressSchema = z.object({
  // 設定画面にいるときは保存しないので、問題を解いている途中か結果画面だけ
  phase: z.enum(["quiz", "result"]),
  column: z.string(),
  roundSize: z.number().int().min(0),
  target: z.enum(["all", "starred"]),
  audio: z.enum(["on", "off"]),
  questions: z.array(quizQuestionSchema).min(1),
  index: z.number().int().min(0),
  // 今の問題で選んだ選択肢。まだ答えていなければ null
  selected: z.string().nullable(),
  mistakes: z.array(quizQuestionSchema),
  correctCount: z.number().int().min(0),
});

export type QuizProgress = z.infer<typeof quizProgressSchema>;

// 保存したクイズの途中経過を検証する。答える列が今は出題できない・出題元の単語が削除されている・
// 数が合わないときは、作り直した方が安全なので null（設定画面から始める）にする
export function restoreQuizProgress(
  saved: unknown,
  { cardIds, quizColumns }: { cardIds: string[]; quizColumns: string[] },
): QuizProgress | null {
  const parsed = quizProgressSchema.safeParse(saved);
  if (!parsed.success) return null;
  const progress = parsed.data;

  if (!quizColumns.includes(progress.column)) return null;
  const ids = new Set(cardIds);
  if (![...progress.questions, ...progress.mistakes].every((q) => ids.has(q.cardId))) return null;
  if (progress.index >= progress.questions.length) return null;
  if (progress.correctCount + progress.mistakes.length > progress.questions.length) return null;
  const question = progress.questions[progress.index];
  if (progress.selected !== null && !question.choices.includes(progress.selected)) return null;
  return progress;
}
