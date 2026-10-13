import { requireUser } from "@/lib/session";

// /learn 以下は全ページログイン必須。個別のページで書かなくて済むようlayoutでDB上のセッションを確認する
// （クライアント遷移ではlayoutは再実行されないため、Cookieの有無はproxy.tsでも毎回確認している）
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
