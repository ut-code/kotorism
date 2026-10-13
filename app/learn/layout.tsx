import { Outlet } from "react-router";

import { requireUser } from "@/lib/session.server";

// /learn 以下は全ページログイン必須。個別のページで書かなくて済むようlayoutでDB上のセッションを確認する
// （クライアント遷移では、loader を持つこの layout も再実行されるわけではないので、
// Cookieの有無は root.tsx の middleware でも毎回確認している）
export async function loader() {
  await requireUser();
  return null;
}

export default function LearnLayout() {
  return <Outlet />;
}
