import type { EssayFeedback, EssaySubmissionDTO, EssayTopicSource } from "./types";

export interface EssaySubmissionRow {
  id: string;
  language: string;
  topicSource: string;
  topicId: string | null;
  topicPrompt: string;
  targetWordCount: number;
  content: string;
  feedback: unknown;
  model: string;
  createdAt: Date;
}

export function toEssaySubmissionDTO(row: EssaySubmissionRow): EssaySubmissionDTO {
  return {
    id: row.id,
    language: row.language,
    topicSource: row.topicSource as EssayTopicSource,
    topicId: row.topicId,
    topicPrompt: row.topicPrompt,
    targetWordCount: row.targetWordCount,
    content: row.content,
    feedback: row.feedback as EssayFeedback,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
  };
}
