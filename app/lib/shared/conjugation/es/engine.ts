import type { ConjugationTable, SixForms, VerbEntry } from "./types";
import { HABER_FORMS } from "./auxiliaries";

const FUTURO_ENDINGS = ["é", "ás", "á", "emos", "éis", "án"];
const CONDICIONAL_ENDINGS = ["ía", "ías", "ía", "íamos", "íais", "ían"];
const IMPERFECTO_AR_ENDINGS = ["aba", "abas", "aba", "ábamos", "abais", "aban"];
const IMPERFECTO_ER_IR_ENDINGS = ["ía", "ías", "ía", "íamos", "íais", "ían"];

function withEndings(stem: string, endings: string[]): SixForms {
  return endings.map((e) => stem + e) as SixForms;
}

function buildCompound(auxSix: SixForms, participio: string): SixForms {
  return auxSix.map((f) => `${f} ${participio}`) as SixForms;
}

interface IrregularBase {
  presente: SixForms;
  pretéritoIndefinido: SixForms;
  subjuntivoPresente: SixForms;
  futuroStem: string;
  participio: string;
  pretéritoImperfecto?: SixForms;
}

// 規則動詞(-ar, -er, -ir)を語幹+語尾のルールから機械的に導出する
function conjugateRegularBase(infinitive: string, group: "ar" | "er" | "ir"): IrregularBase {
  const stem = infinitive.slice(0, -2);
  if (group === "ar") {
    return {
      presente: [stem + "o", stem + "as", stem + "a", stem + "amos", stem + "áis", stem + "an"],
      pretéritoIndefinido: [
        stem + "é",
        stem + "aste",
        stem + "ó",
        stem + "amos",
        stem + "asteis",
        stem + "aron",
      ],
      subjuntivoPresente: [
        stem + "e",
        stem + "es",
        stem + "e",
        stem + "emos",
        stem + "éis",
        stem + "en",
      ],
      futuroStem: infinitive,
      participio: stem + "ado",
    };
  }
  const presenteEndings =
    group === "er" ? ["o", "es", "e", "emos", "éis", "en"] : ["o", "es", "e", "imos", "ís", "en"];
  return {
    presente: presenteEndings.map((e) => stem + e) as SixForms,
    pretéritoIndefinido: [
      stem + "í",
      stem + "iste",
      stem + "ió",
      stem + "imos",
      stem + "isteis",
      stem + "ieron",
    ],
    subjuntivoPresente: [
      stem + "a",
      stem + "as",
      stem + "a",
      stem + "amos",
      stem + "áis",
      stem + "an",
    ],
    futuroStem: infinitive,
    participio: stem + "ido",
  };
}

function deriveImperfecto(infinitive: string, override?: SixForms): SixForms {
  if (override) return override;
  const stem = infinitive.slice(0, -2);
  return infinitive.endsWith("ar")
    ? withEndings(stem, IMPERFECTO_AR_ENDINGS)
    : withEndings(stem, IMPERFECTO_ER_IR_ENDINGS);
}

export function buildConjugation(verb: VerbEntry): ConjugationTable {
  const base: IrregularBase =
    verb.kind === "regular" ? conjugateRegularBase(verb.infinitive, verb.group) : verb;

  const pretéritoImperfecto = deriveImperfecto(verb.infinitive, base.pretéritoImperfecto);
  const futuroSimple = withEndings(base.futuroStem, FUTURO_ENDINGS);
  const condicionalSimple = withEndings(base.futuroStem, CONDICIONAL_ENDINGS);

  return {
    indicativo: {
      presente: base.presente,
      pretéritoImperfecto,
      pretéritoIndefinido: base.pretéritoIndefinido,
      pretéritoPerfectoCompuesto: buildCompound(HABER_FORMS.presente, base.participio),
      pretéritoPluscuamperfecto: buildCompound(HABER_FORMS.pretéritoImperfecto, base.participio),
      futuroSimple,
      futuroCompuesto: buildCompound(HABER_FORMS.futuroSimple, base.participio),
    },
    condicional: {
      simple: condicionalSimple,
      compuesto: buildCompound(HABER_FORMS.condicionalSimple, base.participio),
    },
    subjuntivo: {
      presente: base.subjuntivoPresente,
      pretéritoPerfecto: buildCompound(HABER_FORMS.subjuntivoPresente, base.participio),
    },
  };
}
