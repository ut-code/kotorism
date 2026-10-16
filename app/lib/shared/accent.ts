// ↑ / ↓ キーでアルファベットをアクセント記号付きの文字へ切り替えるための共通処理。
// 動詞の活用（AccentInput）と、表完成・穴埋め・数字タイピングの演習で使う

export type AccentIndex = Map<string, { cycle: string[]; index: number }>;

// 小文字のサイクル（例: ["e", "é", "è"]）から、大文字も含めてどの文字がどのサイクルの何番目かを引ける索引を作る。
// 大文字にすると1文字でなくなるもの（ß → SS）は大文字のサイクルから外す
export function buildAccentIndex(cycles: string[][]): AccentIndex {
  const index: AccentIndex = new Map();
  for (const cycle of cycles) {
    const upperCycle = cycle.map((c) => c.toUpperCase()).filter((c) => c.length === 1);
    for (const target of [cycle, upperCycle]) {
      if (target.length < 2) continue;
      target.forEach((ch, i) => {
        if (!index.has(ch)) index.set(ch, { cycle: target, index: i });
      });
    }
  }
  return index;
}

// 文字をサイクルの次（direction = 1）または前（-1）の文字にする。切り替えられない文字なら null
export function cycleAccent(
  index: AccentIndex,
  ch: string | undefined,
  direction: 1 | -1,
): string | null {
  if (!ch) return null;
  const entry = index.get(ch);
  if (!entry) return null;
  const { cycle, index: i } = entry;
  return cycle[(i + direction + cycle.length) % cycle.length];
}
