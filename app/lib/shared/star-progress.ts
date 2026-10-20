// 単語帳の表の★は、押すたびに回数を1増やす（色が 1回目 → 2回目 → 3回目以降 と進む）。
// 押した瞬間に次の色を見せるため、保存中は押した後の回数（pressedTarget）を見せる。
// 素早く何回か押すと保存が1回ずつ追いついてくるが、その途中で表示が戻らないよう、追いつくまでは pressedTarget を優先する
export function displayedStarCount(savedCount: number, pressedTarget: number | null): number {
  if (pressedTarget === null) return savedCount;
  return Math.max(savedCount, pressedTarget);
}
