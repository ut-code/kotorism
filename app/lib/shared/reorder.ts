// 単語帳の表で、行（単語）や列を長押ししたまま動かして並べ替えるときの計算

// 並んだ項目の中心の位置（行なら縦、列なら横）と、指・マウスの位置から、どの間に入れるかを返す。
// 0 ならいちばん前、centers.length ならいちばん後ろ
export function insertionIndex(centers: number[], position: number): number {
  const index = centers.findIndex((center) => position < center);
  return index === -1 ? centers.length : index;
}

// from 番目の項目を、動かす前の並びでの insertAt 番目の間（0 〜 items.length）へ動かした並びを返す
export function moveToInsertionPoint<T>(items: readonly T[], from: number, insertAt: number): T[] {
  const moved = [...items];
  const [item] = moved.splice(from, 1);
  // 自分より後ろの間に入れるときは、自分を取り除いた分だけ番号が1つ前にずれる
  moved.splice(insertAt > from ? insertAt - 1 : insertAt, 0, item);
  return moved;
}
