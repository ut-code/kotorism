import type {
  TranslationDirection,
  TranslationFeedback,
  TranslationProblemSource,
  TranslationSubmissionDTO,
} from "./types";

export interface TranslationSubmissionRow {
  id: string;
  language: string;
  problemSource: string;
  direction: string;
  problemId: string | null;
  level: string;
  sourceText: string;
  referenceTranslation: string | null;
  content: string;
  feedback: unknown;
  model: string;
  createdAt: Date;
}

export function toTranslationSubmissionDTO(
  row: TranslationSubmissionRow,
): TranslationSubmissionDTO {
  return {
    id: row.id,
    language: row.language,
    problemSource: row.problemSource as TranslationProblemSource,
    direction: row.direction as TranslationDirection,
    problemId: row.problemId,
    level: row.level,
    sourceText: row.sourceText,
    referenceTranslation: row.referenceTranslation,
    content: row.content,
    feedback: row.feedback as TranslationFeedback,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
  };
}
