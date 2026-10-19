import type { CandidateItem } from "./dictionary";
import { CHAR_READINGS } from "./dict/readings";

// 声調なしの音節の表記を揃える（読みの表は ü を v で書く）
const toBase = (syllable: string) => syllable.replace(/ü/g, "v");

/**
 * 漢字1字を、指定した音節で読むときの声調（0 = 軽声）。多音字はその音節の読みをすべて、
 * よく使う読みから順に返す（吗 → ma, má, mǎ）。読みが分からなければ空配列。
 */
export function charTones(char: string, syllable: string): number[] {
  // 読みの表は辞書の字の分だけ前もって作ってある（pinyin パッケージはブラウザで動かず、大きいので読み込まない）
  const readings = CHAR_READINGS[char]?.split(" ") ?? [];
  const base = toBase(syllable);
  return readings.flatMap((reading) => {
    const match = /^([a-zü]+)([1-4]?)$/.exec(reading);
    if (!match || toBase(match[1]) !== base) return [];
    return [match[2] ? Number(match[2]) : 0];
  });
}

/**
 * 候補を、入力した声調との一致で並べ替える（同じグループの中では元の順のまま）。
 * 1. 声調を付けた音節がすべて主な読みと一致する候補（mǎ → 马）
 * 2. 多音字のほかの読みまで含めれば一致する候補（mǎ → 吗）
 * 3. 声調を付けた音節を含まない・読みが分からない候補
 * 4. 一致しない候補
 * tones は音節ごとの入力した声調（付けていなければ null）。
 */
export function rankCandidatesByTone(
  candidates: CandidateItem[],
  syllables: string[],
  tones: (number | null)[],
): CandidateItem[] {
  if (tones.every((t) => t === null)) return candidates;

  const group = (candidate: CandidateItem): number => {
    const chars = [...candidate.text];
    if (chars.length !== candidate.syllableCount) return 2;
    let matched = false;
    let secondary = false;
    for (let i = 0; i < chars.length; i++) {
      const tone = tones[i];
      if (tone === null || tone === undefined) continue;
      const readings = charTones(chars[i], syllables[i]);
      if (readings.length === 0) continue;
      if (!readings.includes(tone)) return 3;
      matched = true;
      if (readings[0] !== tone) secondary = true;
    }
    if (!matched) return 2;
    return secondary ? 1 : 0;
  };

  return candidates
    .map((candidate, index) => ({ candidate, index, group: group(candidate) }))
    .sort((a, b) => a.group - b.group || a.index - b.index)
    .map(({ candidate }) => candidate);
}
