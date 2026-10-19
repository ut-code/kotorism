// ★（filled）・☆（輪郭のみ）のアイコン。文字の★・☆は字の枠と見た目の位置がずれ、隣に並べた目のアイコン（EyeIcon）と
// 高さがそろわないため、同じ 24×24 の viewBox の中心に描いた図形にして、アイコン同士で中心をそろえる。色は currentColor
export default function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      strokeLinejoin="round"
    >
      <path d="M12 2.6l2.83 5.94 6.47.86-4.73 4.53 1.17 6.42L12 17.27l-5.74 3.08 1.17-6.42-4.73-4.53 6.47-.86L12 2.6Z" />
    </svg>
  );
}
