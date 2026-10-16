// 翻訳セクション（/learn/[language]/03）で共通して使う型・定数。
// サーバー側（採点ロジック・Server Action）とクライアント側（TranslationPractice）の両方から参照する。

// "fromJapanese": 和文を外国語に訳す（和文 → 外国語）
// "toJapanese": 外国語を和文に訳す（外国語 → 和文）
export type TranslationDirection = "fromJapanese" | "toJapanese";

// "preset": app/lib/shared/translation/problems.tsの事前用意問題、"custom": ユーザー自身が用意した原文
export type TranslationProblemSource = "preset" | "custom";

// 採点は項目分けせず、訳の正確さ・語彙・文法・自然さを総合的に踏まえた1つの点数で行う。
// 満点は1〜10点の範囲で1点刻みでユーザーが設定画面で選べる
export const TRANSLATION_SCORE_MIN = 1;
export const TRANSLATION_SCORE_MAX = 10;
export const TRANSLATION_SCORE_DEFAULT: number = 10;

export const TRANSLATION_SCORE_OPTIONS: number[] = Array.from(
  { length: TRANSLATION_SCORE_MAX - TRANSLATION_SCORE_MIN + 1 },
  (_, i) => TRANSLATION_SCORE_MIN + i,
);

// 自分で用意する原文の文字数上限
export const CUSTOM_SOURCE_MAX_LENGTH = 300;

export interface TranslationFeedback {
  max: number;
  score: number;
  comment: string;
}

export interface TranslationSubmissionDTO {
  id: string;
  language: string;
  problemSource: TranslationProblemSource;
  direction: TranslationDirection;
  // プリセット問題のとき: app/lib/shared/translation/problems.ts内での識別子。カスタム題材のときはnull
  problemId: string | null;
  sourceText: string;
  // プリセット問題の模範解答（一例）。カスタム題材のときはnull
  referenceTranslation: string | null;
  content: string;
  feedback: TranslationFeedback;
  model: string;
  createdAt: string;
}
