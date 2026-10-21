import { prisma } from "@/lib/server/prisma.server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, requireUser } from "@/lib/server/session.server";
import { getLanguage } from "@/lib/shared/learn/languages";
import { getTranslationProblem } from "../../shared/translation/problems";
import { gradeTranslation, TranslationGradingError } from "../../shared/translation/grading";
import { toTranslationSubmissionDTO } from "../../shared/translation/dto";
import { parseSubmitTranslationInput } from "../../shared/translation/schema";
import { recordStudyEvent } from "@/lib/server/study-events.server";
import {
  CUSTOM_SOURCE_MAX_LENGTH,
  TRANSLATION_SCORE_OPTIONS,
  type SubmitTranslationResult,
  type TranslationDirection,
  type TranslationSubmissionDTO,
} from "../../shared/translation/types";

const CONTENT_MAX_LENGTH = 500;
const HISTORY_LIMIT = 20;

// 翻訳セクションのページを開いた際に、その言語での提出履歴を取得する。
// 未ログインならisLoggedIn: falseを返し、コンポーネント側でログイン案内に切り替える
export async function getTranslationHistory(
  language: string,
): Promise<{ isLoggedIn: boolean; submissions: TranslationSubmissionDTO[] }> {
  const user = await getCurrentUser();
  if (!user) {
    return { isLoggedIn: false, submissions: [] };
  }

  const rows = await prisma.translationSubmission.findMany({
    where: { userId: user.id, language },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  return { isLoggedIn: true, submissions: rows.map(toTranslationSubmissionDTO) };
}

// 訳文を提出し、AI（OpenRouterの無料モデル）による添削結果を取得してDBに保存する
// input は API が request.json() の結果をそのまま渡してくるので、型を信用せず先に検証する。
// そうしないと、型の崩れた入力で .trim() などが落ちて 500 になる
export async function submitTranslation(rawInput: unknown): Promise<SubmitTranslationResult> {
  const user = await requireUser();

  const parsed = parseSubmitTranslationInput(rawInput);
  if (!parsed.success) {
    return { error: parsed.error };
  }
  const input = parsed.data;

  const language = getLanguage(input.language);
  if (!language) {
    return { error: "言語が正しくありません。" };
  }

  if (!TRANSLATION_SCORE_OPTIONS.includes(input.scoreMax)) {
    return { error: "満点の指定が正しくありません。" };
  }

  let problemId: string | null = null;
  let direction: TranslationDirection;
  let sourceText: string;
  let referenceTranslation: string | null;

  if (input.problemSource === "preset") {
    const problem = input.problemId
      ? getTranslationProblem(language.languageSlug, input.problemId)
      : undefined;
    if (!problem) {
      return { error: "問題が見つかりませんでした。" };
    }
    problemId = problem.id;
    direction = problem.direction;
    sourceText = problem.sourceText;
    referenceTranslation = problem.referenceTranslation;
  } else if (input.problemSource === "custom") {
    if (input.direction !== "fromJapanese" && input.direction !== "toJapanese") {
      return { error: "訳す方向が正しくありません。" };
    }
    const customSourceText = (input.customSourceText ?? "").trim();
    if (!customSourceText) {
      return { error: "原文を入力してください。" };
    }
    if (customSourceText.length > CUSTOM_SOURCE_MAX_LENGTH) {
      return { error: `原文は${CUSTOM_SOURCE_MAX_LENGTH}字以内で入力してください。` };
    }
    direction = input.direction;
    sourceText = customSourceText;
    referenceTranslation = null;
  } else {
    return { error: "題材の指定方法が正しくありません。" };
  }

  const content = input.content.trim();
  if (!content) {
    return { error: "訳文を入力してください。" };
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    return { error: `訳文は${CONTENT_MAX_LENGTH}字以内で入力してください。` };
  }

  let graded;
  try {
    graded = await gradeTranslation({
      languageLabel: language.label,
      direction,
      sourceText,
      referenceTranslation,
      content,
      scoreMax: input.scoreMax,
    });
  } catch (error) {
    if (error instanceof TranslationGradingError) {
      return { error: error.message };
    }
    console.error("Translation grading failed", error);
    return {
      error: "AIによる添削中に予期しないエラーが発生しました。時間をおいて再度お試しください。",
    };
  }

  const row = await prisma.translationSubmission.create({
    data: {
      userId: user.id,
      language: language.languageSlug,
      problemSource: input.problemSource,
      direction,
      problemId,
      sourceText,
      referenceTranslation,
      content,
      feedback: graded.feedback as unknown as Prisma.InputJsonValue,
      model: graded.model,
    },
  });

  await recordStudyEvent(user.id, {
    eventType: "translation",
    itemId: row.id,
    language: language.languageSlug,
  });

  return { submission: toTranslationSubmissionDTO(row) };
}
