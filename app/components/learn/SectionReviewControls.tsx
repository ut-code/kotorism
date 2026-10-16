import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { apiGet } from "@/lib/shared/api-client";
import type { SectionProgressDTO } from "@/lib/shared/learn/shared";
import { SectionBookmarkButton } from "@/components/learn/SectionBookmarkButton";

// URL "/learn/french/02" から language・sectionSlug を取り出す。呼び出し側が既に知っている
// 場合（動詞活用ドリルなど）は props で明示的に渡してもよい
function parseSectionPath(pathname: string): { language: string; sectionSlug: string } | null {
  const match = /^\/learn\/([^/]+)\/([^/]+)/.exec(pathname);
  return match ? { language: match[1], sectionSlug: match[2] } : null;
}

interface SectionReviewControlsProps {
  language?: string;
  sectionSlug?: string;
}

// 各セクションページの右上に置く、苦手タグのON/OFFだけを行うブックマークボタン。
// 未ログインでもボタン自体は表示し、押すと会員登録ページに誘導する
export function SectionReviewControls(props: SectionReviewControlsProps) {
  const { pathname } = useLocation();
  // pathname（セクション）が変わるたびに内側のコンポーネントを作り直すことで、
  // 「読み込み中」状態をエフェクト内で同期的にリセットせずに済ませる
  return <SectionReviewControlsForPath key={pathname} pathname={pathname} {...props} />;
}

function SectionReviewControlsForPath({
  pathname,
  language: languageProp,
  sectionSlug: sectionSlugProp,
}: SectionReviewControlsProps & { pathname: string }) {
  const parsed = parseSectionPath(pathname);
  const language = languageProp ?? parsed?.language;
  const sectionSlug = sectionSlugProp ?? parsed?.sectionSlug;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [manuallyTagged, setManuallyTagged] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!language || !sectionSlug) return;
    let cancelled = false;
    apiGet<{ isLoggedIn: boolean; progress: SectionProgressDTO | null }>("/api/learn", {
      language,
      sectionSlug,
    }).then((result) => {
      if (cancelled) return;
      setIsLoggedIn(result.isLoggedIn);
      setManuallyTagged(result.progress?.manuallyTagged ?? false);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [language, sectionSlug]);

  if (!language || !sectionSlug || !loaded) return null;

  return (
    <SectionBookmarkButton
      language={language}
      sectionSlug={sectionSlug}
      isLoggedIn={isLoggedIn}
      initialActive={manuallyTagged}
      size="md"
    />
  );
}
