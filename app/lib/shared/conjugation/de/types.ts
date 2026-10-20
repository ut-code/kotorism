import type { SixForms, TenseOption } from "@/lib/shared/conjugation/shared";

export type { SixForms };

export const PERSONS: readonly string[] = ["ich", "du", "er / sie / es", "wir", "ihr", "sie / Sie"];

export type IndikativTense =
  | "präsens"
  | "präteritum"
  | "perfekt"
  | "plusquamperfekt"
  | "futurI"
  | "futurII";

export type KonjunktivIITense = "präsens" | "perfekt";
export type KonjunktivITense = "präsens" | "perfekt";

export type Mood = "indikativ" | "konjunktivII" | "konjunktivI";

// 出題する時制・法。第二外国語の初級文法で扱うものに絞る
// （過去完了・未来II・接続法II式過去・接続法I式過去は ConjugationTable にはあるが出題しない）
export const TENSE_OPTIONS: TenseOption[] = [
  { mood: "indikativ", tense: "präsens", label: "直説法 現在" },
  { mood: "indikativ", tense: "präteritum", label: "直説法 過去" },
  { mood: "indikativ", tense: "perfekt", label: "直説法 現在完了" },
  { mood: "indikativ", tense: "futurI", label: "直説法 未来" },
  { mood: "konjunktivII", tense: "präsens", label: "接続法II式 現在" },
  { mood: "konjunktivI", tense: "präsens", label: "接続法I式 現在" },
];

export { tenseKey } from "@/lib/shared/conjugation/shared";

export interface ConjugationTable {
  indikativ: Record<IndikativTense, SixForms>;
  konjunktivII: Record<KonjunktivIITense, SixForms>;
  konjunktivI: Record<KonjunktivITense, SixForms>;
}

export function formsFor(table: ConjugationTable, mood: string, tense: string): SixForms {
  switch (mood) {
    case "indikativ":
      return table.indikativ[tense as IndikativTense];
    case "konjunktivII":
      return table.konjunktivII[tense as KonjunktivIITense];
    case "konjunktivI":
      return table.konjunktivI[tense as KonjunktivITense];
    default:
      throw new Error(`unknown mood: ${mood}`);
  }
}

// 完了時制で haben / sein のどちらを助動詞にとるか
export type Auxiliary = "haben" | "sein";

// 弱変化動詞（規則動詞）: 語尾変化のルールだけで活用可能なため、原形と少数の音韻フラグのみ保持する
export interface RegularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "regular";
  auxiliary: Auxiliary;
  // 語幹が d/t/chn/gn/dn などの子音で終わり、活用語尾の前に連結母音 -e- が必要な動詞（arbeiten, öffnen など）
  linkingE?: boolean;
  // 語幹が s/ß/z/x などの歯擦音で終わり、du形の語尾が -st ではなく -t になる動詞（reisen, heißen など）
  sibilantStem?: boolean;
  // -ieren動詞や be-/ver-/ent- などの非分離前綴りをもつ動詞など、過去分詞に ge- を付けない動詞
  noGePrefix?: boolean;
  // 接続法I式が原形からの規則的な導出に従わない動詞（sein のみ）で使う上書き
  konjunktivIOverride?: SixForms;
}

// 強変化動詞・混合変化動詞（不規則動詞）: 現在人称変化・過去基本形・過去分詞を明示的に保持する
export interface IrregularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "irregular";
  auxiliary: Auxiliary;
  präsens: SixForms;
  präteritum: SixForms;
  partizipII: string;
  // 接続法II式の語幹（+ e/est/e/en/et/en を付けて活用形を作る）。過去基本形にウムラウトをかけたもの
  konjunktivIIBase: string;
  // 接続法I式が原形からの規則的な導出に従わない動詞（sein, tun など）で使う上書き
  konjunktivIOverride?: SixForms;
}

export type VerbEntry = RegularVerb | IrregularVerb;
