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

// 組（行）ごと・列ごとに、そのマスが1つ上の組のマスと結合されているか（Excel の結合セルと同じ）。
// データには結合の情報を持たせず、結合したマスには同じ値を保存する。表示するときは同じ値が続くマスを結合して見せる
export type MergedUp = Record<string, boolean>;

// 保存されている値から結合を求める。同じ値が続くマスは結合する。
// 空のマス同士は結合しない（未入力のマスが1つの大きな空欄に見えて紛らわしいのを避けるため）
export function initialMergedUp(rows: Row[], columns: string[]): MergedUp[] {
  return rows.map((row, index) =>
    Object.fromEntries(
      columns.map((column) => {
        const value = row[column] ?? "";
        return [column, index > 0 && value !== "" && value === (rows[index - 1][column] ?? "")];
      }),
    ),
  );
}

// 列ごとの rowSpan。結合の先頭のマスは結合した組の数、結合されたマス（描画しない）は0
export function mergeSpans(mergedUp: MergedUp[], column: string): number[] {
  const spans = mergedUp.map(() => 1);
  for (let i = mergedUp.length - 1; i > 0; i -= 1) {
    if (mergedUp[i][column]) {
      spans[i - 1] += spans[i];
      spans[i] = 0;
    }
  }
  return spans;
}

function withMergedUp(mergedUp: MergedUp[], index: number, column: string, value: boolean) {
  return mergedUp.map((row, i) => (i === index ? { ...row, [column]: value } : row));
}

// 先頭が start の結合（結合していなければそのマスだけ）に、そのすぐ下の組のマスを結合する
export function mergeWithNext(mergedUp: MergedUp[], start: number, column: string): MergedUp[] {
  const next = start + mergeSpans(mergedUp, column)[start];
  if (next >= mergedUp.length) return mergedUp;
  return withMergedUp(mergedUp, next, column, true);
}

// 先頭が start の結合から、いちばん下の組のマスだけを切り離す
export function splitLast(mergedUp: MergedUp[], start: number, column: string): MergedUp[] {
  const span = mergeSpans(mergedUp, column)[start];
  if (span <= 1) return mergedUp;
  return withMergedUp(mergedUp, start + span - 1, column, false);
}

// 保存する値。結合されたマスには、結合の先頭のマスの値を入れる
export function expandMergedValues(rows: Row[], mergedUp: MergedUp[], columns: string[]): Row[] {
  const expanded: Row[] = [];
  rows.forEach((row, index) => {
    const values = { ...row };
    for (const column of columns) {
      if (index > 0 && mergedUp[index]?.[column]) {
        const leader = expanded[index - 1][column];
        if (leader === undefined) delete values[column];
        else values[column] = leader;
      }
    }
    expanded.push(values);
  });
  return expanded;
}
