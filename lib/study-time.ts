// 学習時間の記録 API（/api/study-time）とブラウザ側の計測（useStudyTimer）で共有する型

// 何を学習していた時間か
export type StudyTimeActivity =
  | { kind: "deck"; deckId: string; mode: "study" | "review" | "quiz" }
  | { kind: "section"; language: string; sectionSlug: string };

export type StudyTimeReport = {
  // ページを開くたびにブラウザ側で作る識別子
  clientId: string;
  activity: StudyTimeActivity;
  // 前回の送信から増えた学習時間（秒）
  seconds: number;
};
