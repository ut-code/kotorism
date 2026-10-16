import type { SixForms, TenseOption } from "@/lib/shared/conjugation/shared";

export type { SixForms };

export const PERSONS: readonly string[] = [
  "je",
  "tu",
  "il / elle / on",
  "nous",
  "vous",
  "ils / elles",
];

export type IndicatifTense =
  | "présent"
  | "imparfait"
  | "passéSimple"
  | "passéComposé"
  | "plusQueParfait"
  | "futurSimple"
  | "futurAntérieur";

export type ConditionnelTense = "présent" | "passé";
export type SubjonctifTense = "présent" | "passé";

export type Mood = "indicatif" | "conditionnel" | "subjonctif";

export const TENSE_OPTIONS: TenseOption[] = [
  { mood: "indicatif", tense: "présent", label: "直説法 現在" },
  { mood: "indicatif", tense: "imparfait", label: "直説法 半過去" },
  { mood: "indicatif", tense: "passéSimple", label: "直説法 単純過去" },
  { mood: "indicatif", tense: "passéComposé", label: "直説法 複合過去" },
  { mood: "indicatif", tense: "plusQueParfait", label: "直説法 大過去" },
  { mood: "indicatif", tense: "futurSimple", label: "直説法 単純未来" },
  { mood: "indicatif", tense: "futurAntérieur", label: "直説法 前未来" },
  { mood: "conditionnel", tense: "présent", label: "条件法 現在" },
  { mood: "conditionnel", tense: "passé", label: "条件法 過去" },
  { mood: "subjonctif", tense: "présent", label: "接続法 現在" },
  { mood: "subjonctif", tense: "passé", label: "接続法 過去" },
];

export { tenseKey } from "@/lib/shared/conjugation/shared";

export interface ConjugationTable {
  indicatif: Record<IndicatifTense, SixForms>;
  conditionnel: Record<ConditionnelTense, SixForms>;
  subjonctif: Record<SubjonctifTense, SixForms>;
}

export function formsFor(table: ConjugationTable, mood: string, tense: string): SixForms {
  switch (mood) {
    case "indicatif":
      return table.indicatif[tense as IndicatifTense];
    case "conditionnel":
      return table.conditionnel[tense as ConditionnelTense];
    case "subjonctif":
      return table.subjonctif[tense as SubjonctifTense];
    default:
      throw new Error(`unknown mood: ${mood}`);
  }
}

export type Auxiliary = "avoir" | "être";

export interface RegularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "regular";
  group: 1 | 2 | 3;
  auxiliary: Auxiliary;
}

export interface IrregularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "irregular";
  auxiliary: Auxiliary;
  pastParticiple: string;
  présent: SixForms;
  subjonctifPrésent: SixForms;
  passéSimple: SixForms;
  futurStem: string;
  // 直説法半過去の語幹が「nous形の現在からonsを除いたもの」と一致しない例外(être)でのみ指定する
  imparfaitStem?: string;
}

export type VerbEntry = RegularVerb | IrregularVerb;
