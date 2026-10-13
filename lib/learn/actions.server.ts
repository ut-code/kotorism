import { prisma } from "@/lib/prisma.server";
import { getCurrentUser } from "@/lib/session.server";
import { recordSectionView as recordSectionViewForUser } from "@/lib/recent-activity.server";
import {
  applyManualToggle,
  applyMarkReviewed,
  applyQuizAnswer,
  createInitialSectionProgressState,
  type SectionProgressState,
} from "./section-progress";
import type { SectionProgressDTO } from "./shared";

type Key = { language: string; sectionSlug: string };

function uniqueWhere(userId: string, key: Key) {
  return { userId_language_sectionSlug: { userId, ...key } };
}

function toDTO(key: Key, state: SectionProgressState): SectionProgressDTO {
  return {
    ...key,
    attemptCount: state.attemptCount,
    correctCount: state.correctCount,
    box: state.box,
    autoTagged: state.autoTagged,
    manuallyTagged: state.manuallyTagged,
    needsReview: state.needsReview,
    nextReviewAt: state.nextReviewAt.toISOString(),
    lastReviewedAt: state.lastReviewedAt ? state.lastReviewedAt.toISOString() : null,
  };
}

async function loadState(userId: string, key: Key): Promise<SectionProgressState> {
  const row = await prisma.sectionProgress.findUnique({ where: uniqueWhere(userId, key) });
  if (!row) return createInitialSectionProgressState(new Date());

  return {
    attemptCount: row.attemptCount,
    correctCount: row.correctCount,
    box: row.box,
    autoTagged: row.autoTagged,
    manuallyTagged: row.manuallyTagged,
    needsReview: row.needsReview,
    nextReviewAt: row.nextReviewAt,
    lastReviewedAt: row.lastReviewedAt,
  };
}

async function saveState(userId: string, key: Key, next: SectionProgressState) {
  await prisma.sectionProgress.upsert({
    where: uniqueWhere(userId, key),
    create: { userId, ...key, ...next },
    update: next,
  });
  // セクション一覧ページ（苦手バッジ表示）を次回アクセス時に最新化する
}

// 現在ログイン中のユーザーの、このセクションにおける学習進捗を返す。
// SectionReviewControls がマウント時に呼び、苦手タグの表示・非表示を判断する
// （未ログインの場合は isLoggedIn: false を返し、コンポーネント側でUI自体を隠す合図にする）
export async function getSectionProgress(
  language: string,
  sectionSlug: string,
): Promise<{ isLoggedIn: boolean; progress: SectionProgressDTO | null }> {
  const user = await getCurrentUser();
  if (!user) return { isLoggedIn: false, progress: null };

  const key: Key = { language, sectionSlug };
  const row = await prisma.sectionProgress.findUnique({ where: uniqueWhere(user.id, key) });
  return { isLoggedIn: true, progress: row ? toDTO(key, row) : null };
}

// クイズ形式のセクション（動詞活用ドリルなど）で1問答えるたびに呼ぶ。未ログインなら何もしない
// （練習自体はログイン無しでも続けられるよう、エラーやリダイレクトは起こさない）
export async function recordSectionQuizAnswer(
  language: string,
  sectionSlug: string,
  correct: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return;

  const key: Key = { language, sectionSlug };
  const next = applyQuizAnswer(await loadState(user.id, key), correct, new Date());
  await saveState(user.id, key, next);
}

// 「復習済みにする」ボタン。読み物セクションの自己申告用で、任意のセクションに使える
export async function markSectionReviewed(language: string, sectionSlug: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const key: Key = { language, sectionSlug };
  const next = applyMarkReviewed(await loadState(user.id, key), new Date());
  await saveState(user.id, key, next);
}

// 「苦手」手動タグのON/OFFを切り替える。未ログインなら何もしない
export async function toggleManualSectionTag(language: string, sectionSlug: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const key: Key = { language, sectionSlug };
  const next = applyManualToggle(await loadState(user.id, key), new Date());
  await saveState(user.id, key, next);
}

// セクションページを開いたときに呼び、閲覧日時を記録する（トップページの「最近見た学習ページ」用）。
// 未ログインなら何もしない
export async function recordSectionView(language: string, sectionSlug: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await recordSectionViewForUser(user.id, language, sectionSlug);
}
