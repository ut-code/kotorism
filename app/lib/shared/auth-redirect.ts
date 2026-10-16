// ログイン・新規登録フォームの共通ヘルパー。
// 外部URL（"https://..."）やプロトコル相対URL（"//evil.com"）へのオープンリダイレクトを防ぐため、
// アプリ内の絶対パスのみを許可する
export function safeRedirectPath(target: string | null, fallback = "/my-notebooks"): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return fallback;
  }
  return target;
}
