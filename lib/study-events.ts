// 学習カレンダーで扱う学習操作の種類。StudyEvent / StudyTimeLog / StudyDailyStat の eventType に保存する値
export const STUDY_EVENT_TYPES = [
  "card_study",
  "card_review",
  "card_quiz",
  "section_study",
  "section_quiz",
  "section_review",
  "essay",
  "translation",
] as const;

export type StudyEventType = (typeof STUDY_EVENT_TYPES)[number];

// 絞り込み（問題種別）と内訳に出す名前
export const STUDY_EVENT_LABELS: Record<StudyEventType, string> = {
  card_study: "暗記学習",
  card_review: "★の復習",
  card_quiz: "単語帳クイズ",
  // 学習教材のページを開いていた時間（件数は数えず、学習時間だけを記録する）
  section_study: "教材の学習",
  section_quiz: "教材の練習問題",
  section_review: "教材の復習",
  essay: "作文",
  translation: "翻訳",
};

export function isStudyEventType(value: string): value is StudyEventType {
  return (STUDY_EVENT_TYPES as readonly string[]).includes(value);
}

// 「学んだ単語数」に数える種類（同じ単語は1日1回だけ数える）
export const LEARNED_WORD_EVENT_TYPES: readonly StudyEventType[] = ["card_study", "card_quiz"];
// 「復習数」に数える種類
export const REVIEW_EVENT_TYPES: readonly StudyEventType[] = ["card_review", "section_review"];

// 学習時間だけの日を「学習した日」と数えるのに必要な時間。ページを一瞬開いただけの日は数えない
export const MIN_STUDY_SECONDS = 60;

// その日を「学習した日」とみなすか（カレンダーの学習日数・連続日数で共通の基準）
export function isStudiedDay(stat: { count: number; seconds: number } | undefined): boolean {
  return !!stat && (stat.count > 0 || stat.seconds >= MIN_STUDY_SECONDS);
}

// 連続日数のお祝いメッセージを出す間隔
export const STREAK_MILESTONE_INTERVAL = 10;

// 秒数を「1時間23分」「45分」の形にする
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return seconds > 0 ? "1分未満" : "0分";
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}分`;
  return minutes % 60 === 0 ? `${hours}時間` : `${hours}時間${minutes % 60}分`;
}

export type DayStat = { count: number; seconds: number };

// 学習カレンダーで選んだ期間（1日・1週間・1ヶ月）の内訳に出す教材
export type PeriodMaterial = {
  key: string;
  // 教材名（単語帳のタイトル・学習ページのタイトルなど）
  label: string;
  // 教材の種類や言語（例: "My単語帳"、"フランス語"）
  category: string;
  href: string | null;
  seconds: number;
  counts: { eventType: StudyEventType; label: string; count: number }[];
};

export type PeriodDetail = {
  firstDay: string;
  lastDay: string;
  totalSeconds: number;
  totalCount: number;
  // 暗記学習・クイズで扱った単語の数（同じ単語は1日1回だけ数え、日ごとの数を合計する）
  learnedWordCount: number;
  reviewCount: number;
  // 学習時間の多い順
  materials: PeriodMaterial[];
  // 期間内の日ごとの、教材（PeriodMaterial.key）別の学習時間（秒）
  days: { day: string; seconds: Record<string, number> }[];
  // 上限に達して一部のイベントを読み込めなかったか
  truncated: boolean;
};

// 連続学習の状況。current は今日か昨日まで続いている場合の日数（途切れていれば0）
export type StreakSummary = {
  current: number;
  longest: number;
  // 今日すでに学習済みか（まだなら「今日学習すると current + 1 日」になる）
  studiedToday: boolean;
};
