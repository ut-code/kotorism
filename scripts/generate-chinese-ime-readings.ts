// 中国語 IME の辞書に出てくる漢字の読みの表（app/lib/shared/chinese-ime/dict/readings.ts）を作る。
// 声調の並べ替えに使う。pinyin パッケージ（約 7MB）をブラウザに読み込まずに済むよう、前もって作っておく。
//   npx jiti scripts/generate-chinese-ime-readings.ts
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pinyin } from "pinyin";

import { CHAR_DICT } from "../app/lib/shared/chinese-ime/dict/chars";
import { WORD_DICT } from "../app/lib/shared/chinese-ime/dict/words";

const chars = [
  ...new Set(
    [...Object.values(CHAR_DICT), ...Object.values(WORD_DICT)].flatMap((entries) =>
      entries.flatMap((entry) => [...entry.text]),
    ),
  ),
].sort();

const lines = chars.map((char) => {
  const readings = pinyin(char, { heteronym: true, style: pinyin.STYLE_TONE2 })[0] ?? [];
  return `  ${JSON.stringify(char)}: ${JSON.stringify(readings.join(" "))},`;
});

const outFile = fileURLToPath(
  new URL("../app/lib/shared/chinese-ime/dict/readings.ts", import.meta.url),
);
writeFileSync(
  outFile,
  `// 辞書に出てくる漢字 → 読み（声調は数字、軽声は数字なし。多音字はよく使う読みから順に空白区切り）
// scripts/generate-chinese-ime-readings.ts で作る。手で書き換えない

export const CHAR_READINGS: Record<string, string> = {
${lines.join("\n")}
};
`,
);
// リポジトリのフォーマット（oxfmt）に合わせる
execFileSync("npx", ["oxfmt", outFile], { stdio: "inherit" });
