// 教材名などの短い日本語を、語の途中で改行しないように区切る。
// 区切った塊の間でだけ改行してよい（PhraseText が塊の間に <wbr> を入れ、塊の中は word-break: keep-all で折らない）。
// 「・」「、」「／」や空白の後ろと、「（」の前で区切る
const BREAK_AFTER = new Set(["・", "、", "，", "／", "/", " ", "　", "）", ")"]);
const BREAK_BEFORE = new Set(["（", "("]);

export function splitAtPhraseBreaks(text: string): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const char of text) {
    if (BREAK_BEFORE.has(char) && current !== "") {
      chunks.push(current);
      current = "";
    }
    current += char;
    if (BREAK_AFTER.has(char)) {
      chunks.push(current);
      current = "";
    }
  }
  if (current !== "") chunks.push(current);
  return chunks;
}
