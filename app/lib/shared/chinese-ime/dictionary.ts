import { CHAR_DICT } from "./dict/chars";
import { WORD_DICT } from "./dict/words";
import { isPinyinSyllable, normalizeSyllable } from "./syllables";

export interface CandidateItem {
  text: string;
  weight: number;
  syllableCount: number;
  kind: "sentence" | "word" | "char";
}

export const CHINESE_IME_DICTIONARY = {
  chars: CHAR_DICT,
  words: WORD_DICT,
};

/**
 * 1音節に対する漢字候補を頻度降順で取得する。
 */
export function getCharCandidates(syllable: string): Array<{ text: string; weight: number }> {
  const normalized = normalizeSyllable(syllable);
  const entries = CHAR_DICT[normalized];
  if (!entries) return [];
  return [...entries].sort((a, b) => b.weight - a.weight);
}

/**
 * 複数音節に対する単語候補を取得する。
 */
export function getWordCandidates(syllables: string[]): Array<{ text: string; weight: number }> {
  if (syllables.length === 0) return [];
  const normalizedKey = syllables.map(normalizeSyllable).join("'");
  const entries = WORD_DICT[normalizedKey];
  if (!entries) return [];
  return [...entries].sort((a, b) => b.weight - a.weight);
}

interface DpNode {
  text: string;
  score: number;
  syllableCount: number;
}

/**
 * 音節列または生のピンイン文字列全体を文として最長一致・Viterbi（DP）探索し、
 * 最良の漢字文に変換する。
 */
export function convertSentence(input: string[] | string): string | null {
  if (Array.isArray(input)) {
    return convertFromSyllables(input);
  }
  return convertFromRawString(input);
}

/**
 * 音節配列からの文変換
 */
function convertFromSyllables(syllables: string[]): string | null {
  const n = syllables.length;
  if (n === 0) return null;

  const dp: Array<DpNode | null> = new Array(n + 1).fill(null);
  dp[0] = { text: "", score: 0, syllableCount: 0 };

  for (let i = 0; i < n; i++) {
    const cur = dp[i];
    if (!cur) continue;

    // 単語（最大6音節）
    for (let len = Math.min(n - i, 6); len >= 2; len--) {
      const slice = syllables.slice(i, i + len);
      const words = getWordCandidates(slice);
      if (words.length > 0) {
        const bestWord = words[0];
        const candidateScore = cur.score + bestWord.weight + len * 2000;
        const next = dp[i + len];
        if (!next || candidateScore > next.score) {
          dp[i + len] = {
            text: cur.text + bestWord.text,
            score: candidateScore,
            syllableCount: cur.syllableCount + len,
          };
        }
      }
    }

    // 1字
    const chars = getCharCandidates(syllables[i]);
    if (chars.length > 0) {
      const bestChar = chars[0];
      const candidateScore = cur.score + bestChar.weight;
      const next = dp[i + 1];
      if (!next || candidateScore > next.score) {
        dp[i + 1] = {
          text: cur.text + bestChar.text,
          score: candidateScore,
          syllableCount: cur.syllableCount + 1,
        };
      }
    }
  }

  return dp[n] ? dp[n]!.text : null;
}

/**
 * 生のピンイン文字列からの文変換（音節境界の曖昧性をViterbi探索で最適解決）
 */
function convertFromRawString(rawInput: string): string | null {
  const raw = rawInput.toLowerCase();
  const n = raw.length;
  if (n === 0) return null;

  const dp: Array<DpNode | null> = new Array(n + 1).fill(null);
  dp[0] = { text: "", score: 0, syllableCount: 0 };

  for (let i = 0; i < n; i++) {
    const cur = dp[i];
    if (!cur) continue;

    // アポストロフィをスキップ
    let start = i;
    if (raw[start] === "'") {
      start++;
      if (start >= n) continue;
    }

    // start から始まる可能な音節を探す
    for (let len1 = 1; len1 <= Math.min(n - start, 6); len1++) {
      const end1 = start + len1;
      const syl1 = raw.slice(start, end1);
      if (!isPinyinSyllable(syl1)) continue;

      // 1字候補
      const chars = getCharCandidates(syl1);
      if (chars.length > 0) {
        const bestChar = chars[0];
        const isInterjection =
          syl1 === "o" ||
          syl1 === "e" ||
          syl1 === "a" ||
          syl1 === "hm" ||
          syl1 === "hng" ||
          syl1 === "ng";
        const sylPenalty = syl1 === "n" || syl1 === "m" ? -800 : isInterjection ? -500 : 0;
        // 単語数ペナルティ(-1200)により無用な細分化（例: hao -> ha + o）を防ぐ
        const candidateScore = cur.score + bestChar.weight + syl1.length * 600 - 1200 + sylPenalty;
        const next = dp[end1];
        if (!next || candidateScore > next.score) {
          dp[end1] = {
            text: cur.text + bestChar.text,
            score: candidateScore,
            syllableCount: cur.syllableCount + 1,
          };
        }
      }

      // 2音節単語
      let start2 = end1;
      if (start2 < n && raw[start2] === "'") start2++;
      for (let len2 = 1; len2 <= Math.min(n - start2, 6); len2++) {
        const end2 = start2 + len2;
        const syl2 = raw.slice(start2, end2);
        if (!isPinyinSyllable(syl2)) continue;

        const words2 = getWordCandidates([syl1, syl2]);
        if (words2.length > 0) {
          const bestWord = words2[0];
          const candidateScore =
            cur.score + bestWord.weight + 5000 + (syl1.length + syl2.length) * 600 - 1200;
          const next = dp[end2];
          if (!next || candidateScore > next.score) {
            dp[end2] = {
              text: cur.text + bestWord.text,
              score: candidateScore,
              syllableCount: cur.syllableCount + 2,
            };
          }
        }

        // 3音節単語
        let start3 = end2;
        if (start3 < n && raw[start3] === "'") start3++;
        for (let len3 = 1; len3 <= Math.min(n - start3, 6); len3++) {
          const end3 = start3 + len3;
          const syl3 = raw.slice(start3, end3);
          if (!isPinyinSyllable(syl3)) continue;

          const words3 = getWordCandidates([syl1, syl2, syl3]);
          if (words3.length > 0) {
            const bestWord = words3[0];
            const candidateScore =
              cur.score +
              bestWord.weight +
              8000 +
              (syl1.length + syl2.length + syl3.length) * 600 -
              1200;
            const next = dp[end3];
            if (!next || candidateScore > next.score) {
              dp[end3] = {
                text: cur.text + bestWord.text,
                score: candidateScore,
                syllableCount: cur.syllableCount + 3,
              };
            }
          }

          // 4音節単語
          let start4 = end3;
          if (start4 < n && raw[start4] === "'") start4++;
          for (let len4 = 1; len4 <= Math.min(n - start4, 6); len4++) {
            const end4 = start4 + len4;
            const syl4 = raw.slice(start4, end4);
            if (!isPinyinSyllable(syl4)) continue;

            const words4 = getWordCandidates([syl1, syl2, syl3, syl4]);
            if (words4.length > 0) {
              const bestWord = words4[0];
              const candidateScore =
                cur.score +
                bestWord.weight +
                11000 +
                (syl1.length + syl2.length + syl3.length + syl4.length) * 600 -
                1200;
              const next = dp[end4];
              if (!next || candidateScore > next.score) {
                dp[end4] = {
                  text: cur.text + bestWord.text,
                  score: candidateScore,
                  syllableCount: cur.syllableCount + 4,
                };
              }
            }
          }
        }
      }
    }
  }

  return dp[n] ? dp[n]!.text : null;
}

/**
 * 入力された音節列（またはrawInput）に対して、候補リストを生成する。
 * 1. 2音節以上ある場合は、文全体の変換候補を先頭に出す（文単位での変換）。
 * 2. 入力の先頭から一番長く一致する単語（最長一致単語）を出す。
 * 3. 続けて1字の候補（先頭音節の漢字）を出す。
 */
export function lookupCandidates(syllables: string[], rawInput?: string): CandidateItem[] {
  if (syllables.length === 0) return [];

  const candidates: CandidateItem[] = [];
  const seenTexts = new Set<string>();

  // 1. 文単位の変換
  const sentence = rawInput ? convertSentence(rawInput) : convertSentence(syllables);
  if (sentence && !seenTexts.has(sentence)) {
    seenTexts.add(sentence);
    candidates.push({
      text: sentence,
      weight: 1500 + syllables.length * 500,
      syllableCount: syllables.length,
      kind: "sentence",
    });
  }

  // 2. 先頭から一番長く一致する単語を探す
  for (let len = syllables.length; len >= 2; len--) {
    const slice = syllables.slice(0, len);
    const words = getWordCandidates(slice);
    if (words.length > 0) {
      for (const w of words) {
        if (!seenTexts.has(w.text)) {
          seenTexts.add(w.text);
          candidates.push({
            text: w.text,
            weight: w.weight,
            syllableCount: len,
            kind: "word",
          });
        }
      }
      break;
    }
  }

  // 3. 続けて1字の候補を出す（先頭の1音節）
  const charCandidates = getCharCandidates(syllables[0]);
  for (const c of charCandidates) {
    if (!seenTexts.has(c.text)) {
      seenTexts.add(c.text);
      candidates.push({
        text: c.text,
        weight: c.weight,
        syllableCount: 1,
        kind: "char",
      });
    }
  }

  return candidates;
}
