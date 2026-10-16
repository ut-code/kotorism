// SectionProgress（DB上のセクション別学習進捗）をクライアントに渡すためのシリアライズ可能な形。
// Dateはstring（ISO形式）にして渡す
export interface SectionProgressDTO {
  language: string;
  sectionSlug: string;
  attemptCount: number;
  correctCount: number;
  box: number;
  autoTagged: boolean;
  manuallyTagged: boolean;
  needsReview: boolean;
  nextReviewAt: string;
  lastReviewedAt: string | null;
}

// 言語＋セクションスラッグの組を一意に表すキー
export function sectionProgressKey(language: string, sectionSlug: string): string {
  return `${language}.${sectionSlug}`;
}
