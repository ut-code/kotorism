// 作文セクション（/learn/essay/[language]）で共通して使う型・定数。
// サーバー側（採点ロジック・Server Action）とクライアント側（EssayPractice）の両方から参照する。

export type EssayCriterionKey = "vocabulary" | "grammar" | "structure" | "content";

export const ESSAY_CRITERIA: { key: EssayCriterionKey; label: string }[] = [
  { key: "vocabulary", label: "語彙" },
  { key: "grammar", label: "文法" },
  { key: "structure", label: "構成" },
  { key: "content", label: "内容" },
];

// 各採点基準の配点は2点〜5点の範囲でユーザーが指定できる
export const CRITERION_MIN_MAX = 2;
export const CRITERION_MAX_MAX = 5;

export type EssayCriteriaMax = Record<EssayCriterionKey, number>;

export const DEFAULT_CRITERIA_MAX: EssayCriteriaMax = {
  vocabulary: 5,
  grammar: 5,
  structure: 5,
  content: 5,
};

// カスタムお題での分量目安は20〜100の範囲で10刻みに選べる（単位は言語によって字数/語数が変わる。app/lib/shared/essay/length.ts参照）
export const ESSAY_LENGTH_MIN = 20;
export const ESSAY_LENGTH_MAX = 100;
export const ESSAY_LENGTH_STEP = 10;

export const ESSAY_LENGTH_OPTIONS: number[] = Array.from(
  { length: (ESSAY_LENGTH_MAX - ESSAY_LENGTH_MIN) / ESSAY_LENGTH_STEP + 1 },
  (_, i) => ESSAY_LENGTH_MIN + i * ESSAY_LENGTH_STEP,
);

export interface EssayCriterionResult {
  max: number;
  score: number;
  comment: string;
}

export type EssayFeedback = Record<EssayCriterionKey, EssayCriterionResult> & {
  overallComment: string;
};

export type EssayTopicSource = "preset" | "custom";

export interface EssaySubmissionDTO {
  id: string;
  language: string;
  topicSource: EssayTopicSource;
  topicId: string | null;
  topicPrompt: string;
  targetWordCount: number;
  content: string;
  feedback: EssayFeedback;
  model: string;
  createdAt: string;
}

// 作文の提出 API(/api/essay)の応答。失敗時は画面に出せる文言を error に入れる
export type SubmitEssayResult = { error: string } | { submission: EssaySubmissionDTO };
