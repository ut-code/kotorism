import { describe, expect, it } from "vite-plus/test";

import { buildConjugation } from "./engine";
import type { VerbEntry } from "./types";

const parler: VerbEntry = {
  id: "parler",
  infinitive: "parler",
  meaning: "話す",
  kind: "regular",
  group: 1,
  auxiliary: "avoir",
};

const finir: VerbEntry = { ...parler, id: "finir", infinitive: "finir", group: 2 };

describe("buildConjugation (フランス語)", () => {
  it("第1群規則動詞 parler の主な時制を活用する", () => {
    const table = buildConjugation(parler);
    expect(table.indicatif.présent).toEqual([
      "parle",
      "parles",
      "parle",
      "parlons",
      "parlez",
      "parlent",
    ]);
    expect(table.indicatif.futurSimple[0]).toBe("parlerai");
    expect(table.conditionnel.présent[3]).toBe("parlerions");
    expect(table.subjonctif.présent[3]).toBe("parlions");
  });

  it("複合時制は助動詞 avoir + 過去分詞で作る", () => {
    const table = buildConjugation(parler);
    expect(table.indicatif.passéComposé[0]).toBe("ai parlé");
    expect(table.indicatif.plusQueParfait[0]).toBe("avais parlé");
    expect(table.conditionnel.passé[0]).toBe("aurais parlé");
  });

  it("第2群規則動詞 finir は -iss- を挟む", () => {
    const table = buildConjugation(finir);
    expect(table.indicatif.présent[3]).toBe("finissons");
    expect(table.indicatif.imparfait[0]).toBe("finissais");
    expect(table.indicatif.passéComposé[0]).toBe("ai fini");
  });
});
