// WCAG 2 のコントラスト比（https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio）。
// 文字色と背景色を "#rrggbb" で渡すと 1〜21 の比を返す。本文は 4.5 以上が AA の基準

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`#rrggbb 形式ではない色: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  const [r, g, b] = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff].map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
