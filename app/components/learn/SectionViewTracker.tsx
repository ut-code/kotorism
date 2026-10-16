import { useEffect } from "react";
import { useLocation } from "react-router";

import { useStudyTimer } from "@/hooks/useStudyTimer";
import { apiPost } from "@/lib/shared/api-client";

const SECTION_PATH = /^\/learn\/([^/]+)\/([^/]+)/;

// URL "/learn/french/02" のセクションを開いたことと、開いていた時間（学習カレンダー用）を記録する。
// 見た目は何も描画しない。学習ページは静的に配信されるため、サーバー側ではなくクライアントから記録する
export function SectionViewTracker() {
  const { pathname } = useLocation();

  const section = SECTION_PATH.exec(pathname);
  useStudyTimer(
    section ? { kind: "section", language: section[1], sectionSlug: section[2] } : null,
  );

  useEffect(() => {
    const match = SECTION_PATH.exec(pathname);
    if (!match) return;
    apiPost("/api/learn", {
      intent: "recordView",
      language: match[1],
      sectionSlug: match[2],
    }).catch(() => {});
  }, [pathname]);

  return null;
}
