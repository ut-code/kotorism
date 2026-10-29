// トップページの紹介カードを、ロゴ(public/logo.png)の下部の開いた本のページに見立てて描くための輪郭。
// 左ページの形を返す（右ページは左右反転して使う）。外側の辺はまっすぐ縦で、上の辺はのどに向かって下へ曲がり、
// のどで縦になる。下の辺ものどに向かって下がる
export type BookPageShape = {
  // のど側の上端を、外側の上端よりどれだけ下げるか（px）
  dipTop: number;
  // 上の辺が曲がり始める位置（ページ幅に対する割合）
  topBend: number;
  // のどの手前の肩の丸み（0 で急に折れ、1 でなだらかに下がる）
  topRound: number;
  // 外側の下端を、のど側の下端（ページの下端）よりどれだけ上げるか（px）
  dipBottom: number;
  // 下の辺が下がり始める位置（ページ幅に対する割合）
  bottomBend: number;
  // 角の丸み（px）
  radius: number;
};

export const BOOK_PAGE_SHAPE: BookPageShape = {
  dipTop: 72,
  topBend: 0.41,
  topRound: 1,
  dipBottom: 40,
  bottomBend: 0,
  radius: 12,
};

// SVG のパスに書く数値は小数第2位までにする
const n = (v: number) => Math.round(v * 100) / 100;

export function bookPagePath(width: number, height: number, shape: BookPageShape): string {
  const w = width;
  const h = height;
  const top = shape.dipTop;
  const bottom = h - shape.dipBottom;
  // ページが小さいときに角の丸みが辺からはみ出さないようにする
  const r = n(Math.min(shape.radius, w / 4, bottom / 4));
  return [
    `M0,${r} Q0,0 ${r},0`,
    `C${n(w * shape.topBend)},0 ${w},${n(top * (1 - shape.topRound))} ${w},${top}`,
    `V${n(h - r)} Q${w},${h} ${n(w - r)},${h}`,
    `C${n(w * (1 - shape.bottomBend) * 0.8)},${n(h - shape.dipBottom * 0.75)} ${n(w * shape.bottomBend)},${bottom} ${r},${bottom}`,
    `Q0,${bottom} 0,${n(bottom - r)}`,
    "Z",
  ].join(" ");
}
