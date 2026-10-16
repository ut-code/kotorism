// 言語をまたいで共通する型だけを置く場所。活用ルールそのもの（時制の種類・語尾変化など）は
// 言語ごとに大きく異なるため、lib/conjugation/{fr,es}/ 以下にそれぞれ実装する。

export type SixForms = [string, string, string, string, string, string];

export interface VerbLike {
  id: string;
  infinitive: string;
  meaning: string;
}

export interface TenseOption {
  mood: string;
  tense: string;
  label: string;
}

export function tenseKey(mood: string, tense: string): string {
  return `${mood}.${tense}`;
}
