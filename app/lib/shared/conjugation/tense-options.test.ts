import { describe, expect, it } from "vitest";

import { TENSE_OPTIONS as DE } from "./de/types";
import { TENSE_OPTIONS as ES } from "./es/types";
import { TENSE_OPTIONS as FR } from "./fr/types";
import { tenseKey } from "./shared";

const keys = (options: { mood: string; tense: string }[]) =>
  options.map((t) => tenseKey(t.mood, t.tense));

// 第二外国語の初学者向けに、初級文法で扱う時制・法だけを出題する
describe("出題する時制・法", () => {
  it("フランス語", () => {
    expect(keys(FR)).toEqual([
      "indicatif.présent",
      "indicatif.passéComposé",
      "indicatif.imparfait",
      "indicatif.futurSimple",
      "conditionnel.présent",
      "subjonctif.présent",
    ]);
  });

  it("スペイン語", () => {
    expect(keys(ES)).toEqual([
      "indicativo.presente",
      "indicativo.pretéritoIndefinido",
      "indicativo.pretéritoImperfecto",
      "indicativo.pretéritoPerfectoCompuesto",
      "indicativo.futuroSimple",
      "condicional.simple",
      "subjuntivo.presente",
    ]);
  });

  it("ドイツ語", () => {
    expect(keys(DE)).toEqual([
      "indikativ.präsens",
      "indikativ.präteritum",
      "indikativ.perfekt",
      "indikativ.futurI",
      "konjunktivII.präsens",
      "konjunktivI.präsens",
    ]);
  });
});
