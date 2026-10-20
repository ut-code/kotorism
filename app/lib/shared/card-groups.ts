import type { CardData } from "@/lib/shared/card-data";

type Row = CardData["rows"][number];

// どの列も空の組を取り除く。組を消すときは、その組のマスを全部空にして保存する。
// 全部の組が空なら、空の組を1つだけ残す（見出し語だけの単語。CardData の rows は空にしない）
export function compactRows(rows: Row[]): Row[] {
  const filled = rows.filter((row) => Object.keys(row).length > 0);
  return filled.length > 0 ? filled : [{}];
}

// 表に上から並んだ行を単語にまとめる。Excel の結合セルと同じく、見出し語が空の行はすぐ上の単語の新しい組にする
// （多義語を1つの単語に複数の組で持たせる）。先頭の行の見出し語が空なら、その組はこの行の並びより手前
// （いまある最後の単語）に付ける分として continuation で返す
export function groupContinuationRows(entries: CardData[]): {
  continuation: Row[];
  cards: CardData[];
} {
  const continuation: Row[] = [];
  const cards: CardData[] = [];
  for (const entry of entries) {
    const previous = cards.at(-1);
    if (entry.head.trim() !== "") cards.push({ head: entry.head, rows: [...entry.rows] });
    else if (previous) previous.rows.push(...entry.rows);
    else continuation.push(...entry.rows);
  }
  return { continuation, cards };
}
