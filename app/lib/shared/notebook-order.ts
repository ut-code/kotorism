// My単語帳の一覧の並び方

type Orderable = { favorite: boolean; studied: boolean; listPosition: number; createdAt: Date };

// 一覧のまとまり。お気に入り（0）が一番上、学習済み（2）が一番下。学習済みにしたお気に入りは学習済みにまとめる
// （お気に入りの印は残るので、学習中に戻すとお気に入りの位置へ戻る）
export function notebookGroup({ favorite, studied }: { favorite: boolean; studied: boolean }) {
  if (studied) return 2;
  return favorite ? 0 : 1;
}

// まとまりの順（お気に入り → それ以外 → 学習済み）に並べ、それぞれの中では並び順（listPosition の小さい順）、
// 同じ並び順なら作成日の新しい順に並べる
export function sortNotebooks<T extends Orderable>(notebooks: readonly T[]): T[] {
  return [...notebooks].sort(
    (a, b) =>
      notebookGroup(a) - notebookGroup(b) ||
      a.listPosition - b.listPosition ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

// 長押しで並べ替えるとき、まとまりの境目はまたがせない。from 番目と同じまとまりの端に、入れる位置を収める
// （groups は並んだ順の各単語帳のまとまり（notebookGroup）。入れる位置は lib/shared/reorder.ts と同じく間の番号）
export function clampToGroup(groups: readonly number[], from: number, insertAt: number): number {
  const start = groups.indexOf(groups[from]);
  const end = groups.lastIndexOf(groups[from]) + 1;
  return Math.min(Math.max(insertAt, start), end);
}
