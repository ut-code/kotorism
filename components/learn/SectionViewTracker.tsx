"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { recordSectionView } from "@/lib/learn/actions";

// URL "/learn/french/02" のセクションを開いたことを記録する。見た目は何も描画しない。
// 学習ページは静的に配信されるため、サーバー側ではなくマウント時にクライアントから記録する
export function SectionViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const match = /^\/learn\/([^/]+)\/([^/]+)/.exec(pathname);
    if (!match) return;
    void recordSectionView(match[1], match[2]);
  }, [pathname]);

  return null;
}
