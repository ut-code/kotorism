// セクション一覧の空欄マーク・各セクションページの苦手トグルボタンで共通して使うブックマーク型アイコン。
// filled=true で塗りつぶし（苦手セクション）、false で輪郭のみ（通常）を描く
export function BookmarkIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75v17.5l-6-4.2-6 4.2V3.75Z"
      />
    </svg>
  );
}
