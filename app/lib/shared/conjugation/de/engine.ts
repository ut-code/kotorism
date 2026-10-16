import type { Auxiliary, ConjugationTable, RegularVerb, SixForms, VerbEntry } from "./types";
import { HABEN_FORMS, SEIN_FORMS, WERDEN_PRÄSENS } from "./auxiliaries";

const KONJUNKTIV_ENDINGS = ["e", "est", "e", "en", "et", "en"];

function withEndings(stem: string, endings: string[]): SixForms {
  return endings.map((ending) => stem + ending) as SixForms;
}

// 原形から接続法I式（sein以外は必ず規則的に作れる）を導出する
// 例: gehen -> geh -> gehe/gehest/gehe/gehen/gehet/gehen
function konjunktivIFromInfinitive(infinitive: string): SixForms {
  const stem = infinitive.endsWith("en") ? infinitive.slice(0, -2) : infinitive.slice(0, -1);
  return withEndings(stem, KONJUNKTIV_ENDINGS);
}

function auxiliaryForms(auxiliary: Auxiliary) {
  return auxiliary === "sein" ? SEIN_FORMS : HABEN_FORMS;
}

function buildCompound(auxSix: SixForms, partizipII: string): SixForms {
  return auxSix.map((f) => `${f} ${partizipII}`) as SixForms;
}

function buildFuturII(partizipII: string, auxInfinitive: string): SixForms {
  return WERDEN_PRÄSENS.map((f) => `${f} ${partizipII} ${auxInfinitive}`) as SixForms;
}

interface RegularBase {
  präsens: SixForms;
  präteritum: SixForms;
  partizipII: string;
}

// 弱変化動詞(規則動詞)を語幹+語尾のルールから機械的に導出する
function conjugateRegularBase(verb: RegularVerb): RegularBase {
  const stem = verb.infinitive.replace(/en$/, "");
  // 語幹が d/t などで終わる動詞は、子音で始まる語尾の前に連結母音 -e- を挟む(arbeiten -> arbeitet)
  const linkedStem = verb.linkingE ? stem + "e" : stem;

  const duEnding = verb.sibilantStem ? "t" : verb.linkingE ? "est" : "st";

  const präsens: SixForms = [
    stem + "e",
    stem + duEnding,
    linkedStem + "t",
    stem + "en",
    linkedStem + "t",
    stem + "en",
  ];

  const präteritum: SixForms = [
    linkedStem + "te",
    linkedStem + "test",
    linkedStem + "te",
    linkedStem + "ten",
    linkedStem + "tet",
    linkedStem + "ten",
  ];

  const partizipII = (verb.noGePrefix ? "" : "ge") + linkedStem + "t";

  return { präsens, präteritum, partizipII };
}

export function buildConjugation(verb: VerbEntry): ConjugationTable {
  const base =
    verb.kind === "regular"
      ? conjugateRegularBase(verb)
      : { präsens: verb.präsens, präteritum: verb.präteritum, partizipII: verb.partizipII };

  // 弱変化動詞の接続法II式は過去形と同形。強変化・混合変化動詞は過去基本形にウムラウトをかけた語幹から作る
  const konjunktivIIPräsens =
    verb.kind === "regular"
      ? base.präteritum
      : withEndings(verb.konjunktivIIBase, KONJUNKTIV_ENDINGS);

  const konjunktivIPräsens = verb.konjunktivIOverride ?? konjunktivIFromInfinitive(verb.infinitive);

  const aux = auxiliaryForms(verb.auxiliary);
  const auxInfinitive = verb.auxiliary;

  return {
    indikativ: {
      präsens: base.präsens,
      präteritum: base.präteritum,
      perfekt: buildCompound(aux.präsens, base.partizipII),
      plusquamperfekt: buildCompound(aux.präteritum, base.partizipII),
      futurI: WERDEN_PRÄSENS.map((f) => `${f} ${verb.infinitive}`) as SixForms,
      futurII: buildFuturII(base.partizipII, auxInfinitive),
    },
    konjunktivII: {
      präsens: konjunktivIIPräsens,
      perfekt: buildCompound(aux.konjunktivII, base.partizipII),
    },
    konjunktivI: {
      präsens: konjunktivIPräsens,
      perfekt: buildCompound(aux.konjunktivI, base.partizipII),
    },
  };
}
