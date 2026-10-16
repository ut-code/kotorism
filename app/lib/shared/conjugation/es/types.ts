import type { SixForms, TenseOption } from "@/lib/shared/conjugation/shared";

export type { SixForms };

export const PERSONS: readonly string[] = [
  "yo",
  "tú",
  "él / ella / usted",
  "nosotros / nosotras",
  "vosotros / vosotras",
  "ellos / ellas / ustedes",
];

export type IndicativoTense =
  | "presente"
  | "pretéritoImperfecto"
  | "pretéritoIndefinido"
  | "pretéritoPerfectoCompuesto"
  | "pretéritoPluscuamperfecto"
  | "futuroSimple"
  | "futuroCompuesto";

export type CondicionalTense = "simple" | "compuesto";
export type SubjuntivoTense = "presente" | "pretéritoPerfecto";

export type Mood = "indicativo" | "condicional" | "subjuntivo";

export const TENSE_OPTIONS: TenseOption[] = [
  { mood: "indicativo", tense: "presente", label: "直説法 現在" },
  { mood: "indicativo", tense: "pretéritoImperfecto", label: "直説法 線過去" },
  { mood: "indicativo", tense: "pretéritoIndefinido", label: "直説法 点過去" },
  { mood: "indicativo", tense: "pretéritoPerfectoCompuesto", label: "直説法 現在完了" },
  { mood: "indicativo", tense: "pretéritoPluscuamperfecto", label: "直説法 過去完了" },
  { mood: "indicativo", tense: "futuroSimple", label: "直説法 未来" },
  { mood: "indicativo", tense: "futuroCompuesto", label: "直説法 未来完了" },
  { mood: "condicional", tense: "simple", label: "可能法 現在" },
  { mood: "condicional", tense: "compuesto", label: "可能法 過去" },
  { mood: "subjuntivo", tense: "presente", label: "接続法 現在" },
  { mood: "subjuntivo", tense: "pretéritoPerfecto", label: "接続法 現在完了" },
];

export { tenseKey } from "@/lib/shared/conjugation/shared";

export interface ConjugationTable {
  indicativo: Record<IndicativoTense, SixForms>;
  condicional: Record<CondicionalTense, SixForms>;
  subjuntivo: Record<SubjuntivoTense, SixForms>;
}

export function formsFor(table: ConjugationTable, mood: string, tense: string): SixForms {
  switch (mood) {
    case "indicativo":
      return table.indicativo[tense as IndicativoTense];
    case "condicional":
      return table.condicional[tense as CondicionalTense];
    case "subjuntivo":
      return table.subjuntivo[tense as SubjuntivoTense];
    default:
      throw new Error(`unknown mood: ${mood}`);
  }
}

export interface RegularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "regular";
  group: "ar" | "er" | "ir";
}

export interface IrregularVerb {
  id: string;
  infinitive: string;
  meaning: string;
  kind: "irregular";
  participio: string;
  presente: SixForms;
  pretéritoIndefinido: SixForms;
  subjuntivoPresente: SixForms;
  futuroStem: string;
  // ser・ir・verのみ、直説法線過去が語幹+語尾のルールに乗らない完全な例外形なのでここで直接指定する
  pretéritoImperfecto?: SixForms;
}

export type VerbEntry = RegularVerb | IrregularVerb;
