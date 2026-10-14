import { prisma } from "@/lib/prisma.server";
import type { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUser, requireUser } from "@/lib/session.server";
import { getLanguage } from "@/app/learn/languages";
import { getEssayTopic } from "./topics";
import { EssayGradingError, gradeEssay } from "./grading";
import { toEssaySubmissionDTO } from "./dto";
import { countEssayLength, getEssayLengthUnit } from "./length";
import {
  CRITERION_MAX_MAX,
  CRITERION_MIN_MAX,
  ESSAY_CRITERIA,
  ESSAY_LENGTH_OPTIONS,
  type EssayCriteriaMax,
  type EssaySubmissionDTO,
  type EssayTopicSource,
} from "./types";

const CONTENT_MAX_LENGTH = 2000;
const CUSTOM_TOPIC_MAX_LENGTH = 200;
const HISTORY_LIMIT = 20;

// 作文ウィジェット（右下の丸ボタン）で言語を選んだ際に、その言語での提出履歴を取得する。
// 未ログインならisLoggedIn: falseを返し、コンポーネント側でログイン案内に切り替える
export async function getEssayHistory(
  language: string,
): Promise<{ isLoggedIn: boolean; submissions: EssaySubmissionDTO[] }> {
  const user = await getCurrentUser();
  if (!user) {
    return { isLoggedIn: false, submissions: [] };
  }

  const rows = await prisma.essaySubmission.findMany({
    where: { userId: user.id, language },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  return { isLoggedIn: true, submissions: rows.map(toEssaySubmissionDTO) };
}

export interface SubmitEssayInput {
  language: string;
  topicSource: EssayTopicSource;
  // topicSource: "preset" のとき使う（lib/essay/topics.tsのid）
  topicId?: string;
  // topicSource: "custom" のとき使う（ユーザーが自由に入力したお題文）
  customTopicPrompt?: string;
  // topicSource: "custom" のとき使う（ESSAY_LENGTH_OPTIONSのいずれか）
  customTargetWordCount?: number;
  content: string;
  criteriaMax: EssayCriteriaMax;
}

export type SubmitEssayResult = { error: string } | { submission: EssaySubmissionDTO };

function validateCriteriaMax(criteriaMax: EssayCriteriaMax): string | null {
  for (const { key, label } of ESSAY_CRITERIA) {
    const value = criteriaMax[key];
    if (!Number.isInteger(value) || value < CRITERION_MIN_MAX || value > CRITERION_MAX_MAX) {
      return `「${label}」の配点は${CRITERION_MIN_MAX}〜${CRITERION_MAX_MAX}点の範囲で指定してください。`;
    }
  }
  return null;
}

// 作文を提出し、AI（OpenRouterの無料モデル）による添削結果を取得してDBに保存する
export async function submitEssay(input: SubmitEssayInput): Promise<SubmitEssayResult> {
  const user = await requireUser();

  const language = getLanguage(input.language);
  if (!language) {
    return { error: "言語が正しくありません。" };
  }

  const criteriaError = validateCriteriaMax(input.criteriaMax);
  if (criteriaError) {
    return { error: criteriaError };
  }

  let topicId: string | null = null;
  let topicPrompt: string;
  let targetWordCount: number;

  if (input.topicSource === "preset") {
    const topic = input.topicId ? getEssayTopic(language.languageSlug, input.topicId) : undefined;
    if (!topic) {
      return { error: "お題が見つかりませんでした。" };
    }
    topicId = topic.id;
    topicPrompt = topic.prompt;
    targetWordCount = topic.targetWordCount;
  } else if (input.topicSource === "custom") {
    const customPrompt = (input.customTopicPrompt ?? "").trim();
    if (!customPrompt) {
      return { error: "お題を入力してください。" };
    }
    if (customPrompt.length > CUSTOM_TOPIC_MAX_LENGTH) {
      return { error: `お題は${CUSTOM_TOPIC_MAX_LENGTH}字以内で入力してください。` };
    }
    if (
      typeof input.customTargetWordCount !== "number" ||
      !ESSAY_LENGTH_OPTIONS.includes(input.customTargetWordCount)
    ) {
      return { error: "分量目安が正しくありません。" };
    }
    topicPrompt = customPrompt;
    targetWordCount = input.customTargetWordCount;
  } else {
    return { error: "お題の指定方法が正しくありません。" };
  }

  const content = input.content.trim();
  if (!content) {
    return { error: "作文を入力してください。" };
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    return { error: `作文は${CONTENT_MAX_LENGTH}字以内で入力してください。` };
  }

  const lengthUnit = getEssayLengthUnit(language.languageSlug);

  let graded;
  try {
    graded = await gradeEssay({
      languageLabel: language.label,
      topicPrompt,
      targetWordCount,
      lengthUnit,
      actualLength: countEssayLength(content, lengthUnit),
      content,
      criteriaMax: input.criteriaMax,
    });
  } catch (error) {
    if (error instanceof EssayGradingError) {
      return { error: error.message };
    }
    console.error("Essay grading failed", error);
    return {
      error: "AIによる添削中に予期しないエラーが発生しました。時間をおいて再度お試しください。",
    };
  }

  const row = await prisma.essaySubmission.create({
    data: {
      userId: user.id,
      language: language.languageSlug,
      topicSource: input.topicSource,
      topicId,
      topicPrompt,
      targetWordCount,
      content,
      feedback: graded.feedback as unknown as Prisma.InputJsonValue,
      model: graded.model,
    },
  });

  return { submission: toEssaySubmissionDTO(row) };
}
