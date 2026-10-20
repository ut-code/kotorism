// 動詞の活用の選択式（4択）の選択肢を作る。
// 誤答には、まず同じ動詞・同じ時制の別人称の形を使い（人称語尾の聞き分けを問う）、
// 足りなければ同じ人称の別の時制の形で埋める。正解と同じ綴りの形は誤答にしない

const CHOICE_COUNT = 4;

function shuffle<T>(array: T[], random: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function conjugationChoices(
  answer: string,
  // 同じ動詞・同じ時制の6人称の形（正解を含んでよい）
  sameTenseForms: readonly string[],
  // 同じ動詞・同じ人称の、ほかの時制の形
  samePersonForms: readonly string[],
  random: () => number = Math.random,
): string[] {
  const distractors: string[] = [];
  for (const candidates of [sameTenseForms, samePersonForms]) {
    const fresh = [...new Set(candidates)].filter((c) => c !== answer && !distractors.includes(c));
    distractors.push(...shuffle(fresh, random).slice(0, CHOICE_COUNT - 1 - distractors.length));
  }
  return shuffle([answer, ...distractors], random);
}
