import { useEffect } from "react";
import { useLocation } from "react-router";

import { apiPost } from "@/lib/shared/api-client";

// URL "/learn/french/02" のセクションを開いたことを記録する。見た目は何も描画しない。
// 学習ページは静的に配信されるため、サーバー側ではなくマウント時にクライアントから記録する
export function SectionViewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = /^\/learn\/([^/]+)\/([^/]+)/.exec(pathname);
    if (!match) return;
    apiPost("/api/learn", {
      intent: "recordView",
      language: match[1],
      sectionSlug: match[2],
    }).catch(() => {});
  }, [pathname]);

  return null;
}
