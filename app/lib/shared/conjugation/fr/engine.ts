import type { Auxiliary, ConjugationTable, SixForms, VerbEntry } from "./types";
import { AVOIR_FORMS, ETRE_FORMS } from "./auxiliaries";

const FUTUR_ENDINGS = ["ai", "as", "a", "ons", "ez", "ont"];
const IMPARFAIT_ENDINGS = ["ais", "ais", "ait", "ions", "iez", "aient"];

function withEndings(stem: string, endings: string[]): SixForms {
  return endings.map((e) => stem + e) as SixForms;
}

function deriveImparfait(présent: SixForms, overrideStem?: string): SixForms {
  const stem = overrideStem ?? présent[3].replace(/ons$/, "");
  return withEndings(stem, IMPARFAIT_ENDINGS);
}

function deriveFuturEtConditionnel(futurStem: string): {
  futurSimple: SixForms;
  conditionnelPrésent: SixForms;
} {
  return {
    futurSimple: withEndings(futurStem, FUTUR_ENDINGS),
    conditionnelPrésent: withEndings(futurStem, IMPARFAIT_ENDINGS),
  };
}

function buildCompound(auxSix: SixForms, pastParticiple: string): SixForms {
  return auxSix.map((f) => `${f} ${pastParticiple}`) as SixForms;
}

function auxiliaryForms(auxiliary: Auxiliary) {
  return auxiliary === "être" ? ETRE_FORMS : AVOIR_FORMS;
}

interface RegularBase {
  présent: SixForms;
  subjonctifPrésent: SixForms;
  passéSimple: SixForms;
  futurStem: string;
  pastParticiple: string;
  imparfaitStem?: string;
}

// 規則動詞(-er, -ir(finir型), -re(vendre型))を語幹+語尾のルールから機械的に導出する
function conjugateRegularBase(infinitive: string, group: 1 | 2 | 3): RegularBase {
  if (group === 1) {
    const stem = infinitive.slice(0, -2);
    return {
      présent: [stem + "e", stem + "es", stem + "e", stem + "ons", stem + "ez", stem + "ent"],
      subjonctifPrésent: [
        stem + "e",
        stem + "es",
        stem + "e",
        stem + "ions",
        stem + "iez",
        stem + "ent",
      ],
      passéSimple: [
        stem + "ai",
        stem + "as",
        stem + "a",
        stem + "âmes",
        stem + "âtes",
        stem + "èrent",
      ],
      futurStem: infinitive,
      pastParticiple: stem + "é",
    };
  }
  if (group === 2) {
    const stem = infinitive.slice(0, -2);
    return {
      présent: [
        stem + "is",
        stem + "is",
        stem + "it",
        stem + "issons",
        stem + "issez",
        stem + "issent",
      ],
      subjonctifPrésent: [
        stem + "isse",
        stem + "isses",
        stem + "isse",
        stem + "issions",
        stem + "issiez",
        stem + "issent",
      ],
      passéSimple: [
        stem + "is",
        stem + "is",
        stem + "it",
        stem + "îmes",
        stem + "îtes",
        stem + "irent",
      ],
      futurStem: infinitive,
      pastParticiple: stem + "i",
    };
  }
  const stem = infinitive.slice(0, -2);
  return {
    présent: [stem + "s", stem + "s", stem, stem + "ons", stem + "ez", stem + "ent"],
    subjonctifPrésent: [
      stem + "e",
      stem + "es",
      stem + "e",
      stem + "ions",
      stem + "iez",
      stem + "ent",
    ],
    passéSimple: [
      stem + "is",
      stem + "is",
      stem + "it",
      stem + "îmes",
      stem + "îtes",
      stem + "irent",
    ],
    futurStem: infinitive.slice(0, -1),
    pastParticiple: stem + "u",
  };
}

export function buildConjugation(verb: VerbEntry): ConjugationTable {
  const base: RegularBase =
    verb.kind === "regular" ? conjugateRegularBase(verb.infinitive, verb.group) : verb;

  const imparfait = deriveImparfait(base.présent, base.imparfaitStem);
  const { futurSimple, conditionnelPrésent } = deriveFuturEtConditionnel(base.futurStem);
  const aux = auxiliaryForms(verb.auxiliary);

  return {
    indicatif: {
      présent: base.présent,
      imparfait,
      passéSimple: base.passéSimple,
      passéComposé: buildCompound(aux.présent, base.pastParticiple),
      plusQueParfait: buildCompound(aux.imparfait, base.pastParticiple),
      futurSimple,
      futurAntérieur: buildCompound(aux.futurSimple, base.pastParticiple),
    },
    conditionnel: {
      présent: conditionnelPrésent,
      passé: buildCompound(aux.conditionnelPrésent, base.pastParticiple),
    },
    subjonctif: {
      présent: base.subjonctifPrésent,
      passé: buildCompound(aux.subjonctifPrésent, base.pastParticiple),
    },
  };
}
