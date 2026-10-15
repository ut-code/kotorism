import type { SixForms } from "./types";

interface AuxiliaryForms {
  präsens: SixForms;
  präteritum: SixForms;
  konjunktivII: SixForms;
  konjunktivI: SixForms;
}

export const HABEN_FORMS: AuxiliaryForms = {
  präsens: ["habe", "hast", "hat", "haben", "habt", "haben"],
  präteritum: ["hatte", "hattest", "hatte", "hatten", "hattet", "hatten"],
  konjunktivII: ["hätte", "hättest", "hätte", "hätten", "hättet", "hätten"],
  konjunktivI: ["habe", "habest", "habe", "haben", "habet", "haben"],
};

export const SEIN_FORMS: AuxiliaryForms = {
  präsens: ["bin", "bist", "ist", "sind", "seid", "sind"],
  präteritum: ["war", "warst", "war", "waren", "wart", "waren"],
  konjunktivII: ["wäre", "wärest", "wäre", "wären", "wäret", "wären"],
  konjunktivI: ["sei", "seist", "sei", "seien", "seiet", "seien"],
};

// Futur I・II を作るための werden の直説法現在人称変化
export const WERDEN_PRÄSENS: SixForms = ["werde", "wirst", "wird", "werden", "werdet", "werden"];
