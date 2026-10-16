// 学習教材（/learn/[language]/[sectionSlug]）の「苦手管理モード」で使う、
// セクション単位の間隔反復（SRS）状態遷移ロジック。
// Prisma/Next.jsに依存しない純粋関数にし、サーバー側（actions.ts）とクライアント側
// （SectionCard.tsx / ConjugationPractice.tsx の楽観的更新）で同じ計算を共有できるようにする。

// Leitner式の箱番号（0〜6）ごとの復習間隔（日数）。「正解」または「復習済みにする」操作のたびに
// 箱が1つ進み、間隔が伸びていく
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14, 30] as const;
export const MAX_BOX_INDEX = BOX_INTERVAL_DAYS.length - 1; // 6
// 自動タグ（クイズでの誤答由来）は、この箱番号まで連続正解で到達すると解除される（= 3連続正解）
export const AUTO_CLEAR_BOX_THRESHOLD = 3;

export interface SectionProgressState {
  attemptCount: number;
  correctCount: number;
  box: number;
  autoTagged: boolean;
  manuallyTagged: boolean;
  needsReview: boolean;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
}

export function createInitialSectionProgressState(now: Date): SectionProgressState {
  return {
    attemptCount: 0,
    correctCount: 0,
    box: 0,
    autoTagged: false,
    manuallyTagged: false,
    needsReview: false,
    nextReviewAt: now,
    lastReviewedAt: null,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// attemptCount===0（一度もクイズに回答したことがない＝読み物セクション、または未着手）の場合は
// 自動タグの根拠になり得ない。box===0だけでは「未着手」と「直近で間違えた」を区別できないため
function autoFlagActive(box: number, attemptCount: number): boolean {
  return attemptCount > 0 && box < AUTO_CLEAR_BOX_THRESHOLD;
}

// クイズ形式のセクション（動詞活用ドリルなど）で1問答えるたびに呼ぶ
export function applyQuizAnswer(
  state: SectionProgressState,
  correct: boolean,
  now: Date,
): SectionProgressState {
  const attemptCount = state.attemptCount + 1;
  const correctCount = state.correctCount + (correct ? 1 : 0);
  const box = correct ? Math.min(state.box + 1, MAX_BOX_INDEX) : 0;
  // 誤答は1回でも即座に自動タグを立てる。正解が続けば3連続でタグが解除される
  const autoTagged = correct ? autoFlagActive(box, attemptCount) : true;

  return {
    attemptCount,
    correctCount,
    box,
    autoTagged,
    manuallyTagged: state.manuallyTagged,
    needsReview: state.manuallyTagged || autoTagged,
    nextReviewAt: addDays(now, BOX_INTERVAL_DAYS[box]),
    lastReviewedAt: now,
  };
}

// 「復習済みにする」操作（読み物セクションの自己申告、またはクイズ以外での復習完了報告）。
// クイズの正解と同じく箱を1つ進めるが、attemptCount/correctCountは変化させない
export function applyMarkReviewed(state: SectionProgressState, now: Date): SectionProgressState {
  const box = Math.min(state.box + 1, MAX_BOX_INDEX);
  const autoTagged = autoFlagActive(box, state.attemptCount);

  return {
    ...state,
    box,
    autoTagged,
    needsReview: state.manuallyTagged || autoTagged,
    nextReviewAt: addDays(now, BOX_INTERVAL_DAYS[box]),
    lastReviewedAt: now,
  };
}

// 「苦手」手動タグのON/OFFを切り替える。ONにした瞬間は箱を0に戻し、今日中に復習という状態にする
export function applyManualToggle(state: SectionProgressState, now: Date): SectionProgressState {
  const manuallyTagged = !state.manuallyTagged;
  if (manuallyTagged) {
    return {
      ...state,
      manuallyTagged: true,
      box: 0,
      needsReview: true,
      nextReviewAt: now,
    };
  }
  return {
    ...state,
    manuallyTagged: false,
    needsReview: state.autoTagged,
  };
}

// 復習日時を「今日中に復習」「明日」「N日後」という相対表現に変換する
export function relativeReviewLabel(nextReviewAt: Date | string, now: Date): string {
  const diffMs = new Date(nextReviewAt).getTime() - now.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "今日中に復習";
  if (days === 1) return "明日";
  return `${days}日後`;
}
