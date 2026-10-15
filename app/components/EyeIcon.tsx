import { useId } from "react";

// 暗記モードでの表示回数を示す、簡略化した「目」アイコン。
// 単色（currentColor）のシルエットに、maskで虹彩・ハイライトの穴を空けて二層に見せている。
// idはuseIdでインスタンスごとに一意化し、同じページに複数個並んでもmask参照が衝突しないようにする
export default function EyeIcon({ className }: { className?: string }) {
  const maskId = useId();

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx="12" cy="12" r="4.6" fill="black" />
        <circle cx="13.1" cy="10.3" r="1" fill="black" />
      </mask>
      <path
        fill="currentColor"
        mask={`url(#${maskId})`}
        d="M12 5.5C6.6 5.5 2.4 9 1 12c1.4 3 5.6 6.5 11 6.5S21.6 15 23 12c-1.4-3-5.6-6.5-11-6.5Z"
      />
      <circle cx="12" cy="12" r="2.7" fill="currentColor" />
    </svg>
  );
}
