import { prisma } from "@/lib/prisma.server";
import type { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUser, requireUser } from "@/lib/session.server";
import { getLanguage } from "@/app/learn/languages";
import { recordStudyEvent } from "@/lib/study-events.server";
import { getTranslationLevels, getTranslationProblem } from "./problems";
import { gradeTranslation, TranslationGradingError } from "./grading";
import { toTranslationSubmissionDTO } from "./dto";
import {
  CUSTOM_SOURCE_MAX_LENGTH,
  TRANSLATION_SCORE_OPTIONS,
  type TranslationDirection,
  type TranslationProblemSource,
  type TranslationSubmissionDTO,
} from "./types";

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

export interface SubmitTranslationInput {
  language: string;
  problemSource: TranslationProblemSource;
  // problemSource: "preset" のとき使う（lib/translation/problems.tsのid）
  problemId?: string;
  // problemSource: "custom" のとき使う（設定画面で先に選ばせた級・訳す方向）
  direction?: TranslationDirection;
  level?: string;
  // problemSource: "custom" のとき使う（ユーザーが自由に入力した原文）
  customSourceText?: string;
  content: string;
  // 満点（TRANSLATION_SCORE_OPTIONSのいずれか）
  scoreMax: number;
}

export type SubmitTranslationResult = { error: string } | { submission: TranslationSubmissionDTO };

// 訳文を提出し、AI（OpenRouterの無料モデル）による添削結果を取得してDBに保存する
export async function submitTranslation(
  input: SubmitTranslationInput,
): Promise<SubmitTranslationResult> {
  const user = await requireUser();

  const language = getLanguage(input.language);
  if (!language) {
    return { error: "言語が正しくありません。" };
  }

  if (!TRANSLATION_SCORE_OPTIONS.includes(input.scoreMax)) {
    return { error: "満点の指定が正しくありません。" };
  }

  let problemId: string | null = null;
  let direction: TranslationDirection;
  let level: string;
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
    level = problem.level;
    sourceText = problem.sourceText;
    referenceTranslation = problem.referenceTranslation;
  } else if (input.problemSource === "custom") {
    if (input.direction !== "fromJapanese" && input.direction !== "toJapanese") {
      return { error: "訳す方向が正しくありません。" };
    }
    const levels = getTranslationLevels(language.languageSlug);
    if (!input.level || !levels.includes(input.level)) {
      return { error: "級が正しくありません。" };
    }
    const customSourceText = (input.customSourceText ?? "").trim();
    if (!customSourceText) {
      return { error: "原文を入力してください。" };
    }
    if (customSourceText.length > CUSTOM_SOURCE_MAX_LENGTH) {
      return { error: `原文は${CUSTOM_SOURCE_MAX_LENGTH}字以内で入力してください。` };
    }
    direction = input.direction;
    level = input.level;
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
      level,
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
      level,
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
