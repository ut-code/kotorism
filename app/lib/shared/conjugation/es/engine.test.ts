import { describe, expect, it } from "vitest";

import { buildConjugation } from "./engine";
import { formsFor, type RegularVerb, type VerbEntry } from "./types";

const hablar: RegularVerb = {
  id: "hablar",
  infinitive: "hablar",
  meaning: "話す",
  kind: "regular",
  group: "ar",
};
const comer: RegularVerb = { ...hablar, id: "comer", infinitive: "comer", group: "er" };
const vivir: RegularVerb = { ...hablar, id: "vivir", infinitive: "vivir", group: "ir" };

describe("buildConjugation (スペイン語・規則動詞)", () => {
  it("-ar 動詞 hablar の主な時制を活用する", () => {
    const table = buildConjugation(hablar);
    expect(table.indicativo.presente).toEqual([
      "hablo",
      "hablas",
      "habla",
      "hablamos",
      "habláis",
      "hablan",
    ]);
    expect(table.indicativo.pretéritoIndefinido).toEqual([
      "hablé",
      "hablaste",
      "habló",
      "hablamos",
      "hablasteis",
      "hablaron",
    ]);
    expect(table.indicativo.pretéritoImperfecto).toEqual([
      "hablaba",
      "hablabas",
      "hablaba",
      "hablábamos",
      "hablabais",
      "hablaban",
    ]);
    expect(table.subjuntivo.presente).toEqual([
      "hable",
      "hables",
      "hable",
      "hablemos",
      "habléis",
      "hablen",
    ]);
  });

  it("-er 動詞 comer と -ir 動詞 vivir は1・2人称複数の語尾が異なる", () => {
    const comerTable = buildConjugation(comer);
    expect(comerTable.indicativo.presente[3]).toBe("comemos");
    expect(comerTable.indicativo.presente[4]).toBe("coméis");
    expect(comerTable.indicativo.pretéritoIndefinido[2]).toBe("comió");
    expect(comerTable.indicativo.pretéritoImperfecto[0]).toBe("comía");
    expect(comerTable.subjuntivo.presente[0]).toBe("coma");

    const vivirTable = buildConjugation(vivir);
    expect(vivirTable.indicativo.presente[3]).toBe("vivimos");
    expect(vivirTable.indicativo.presente[4]).toBe("vivís");
    expect(vivirTable.indicativo.pretéritoIndefinido[5]).toBe("vivieron");
  });

  it("未来・条件法は原形に語尾を付けて作る", () => {
    const table = buildConjugation(hablar);
    expect(table.indicativo.futuroSimple[0]).toBe("hablaré");
    expect(table.indicativo.futuroSimple[5]).toBe("hablarán");
    expect(table.condicional.simple[3]).toBe("hablaríamos");
  });

  it("複合時制は haber + 過去分詞で作る", () => {
    const table = buildConjugation(hablar);
    expect(table.indicativo.pretéritoPerfectoCompuesto[0]).toBe("he hablado");
    expect(table.indicativo.pretéritoPluscuamperfecto[0]).toBe("había hablado");
    expect(table.indicativo.futuroCompuesto[0]).toBe("habré hablado");
    expect(table.condicional.compuesto[0]).toBe("habría hablado");
    expect(table.subjuntivo.pretéritoPerfecto[0]).toBe("haya hablado");
    expect(buildConjugation(comer).indicativo.pretéritoPerfectoCompuesto[0]).toBe("he comido");
  });
});

describe("buildConjugation (スペイン語・不規則動詞)", () => {
  const tener: VerbEntry = {
    id: "tener",
    infinitive: "tener",
    meaning: "持つ",
    kind: "irregular",
    participio: "tenido",
    presente: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    pretéritoIndefinido: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    subjuntivoPresente: ["tenga", "tengas", "tenga", "tengamos", "tengáis", "tengan"],
    futuroStem: "tendr",
  };

  it("未来・条件法は原形ではなく futuroStem から作る", () => {
    const table = buildConjugation(tener);
    expect(table.indicativo.futuroSimple[0]).toBe("tendré");
    expect(table.condicional.simple[0]).toBe("tendría");
  });

  it("線過去は原形から規則的に導き、完全な例外形(ser)があれば上書きを使う", () => {
    expect(buildConjugation(tener).indicativo.pretéritoImperfecto[0]).toBe("tenía");

    const ser = buildConjugation({
      ...tener,
      id: "ser",
      infinitive: "ser",
      pretéritoImperfecto: ["era", "eras", "era", "éramos", "erais", "eran"],
    });
    expect(ser.indicativo.pretéritoImperfecto[3]).toBe("éramos");
  });

  it("明示された活用形と過去分詞をそのまま使う", () => {
    const table = buildConjugation(tener);
    expect(table.indicativo.presente[1]).toBe("tienes");
    expect(table.indicativo.pretéritoIndefinido[0]).toBe("tuve");
    expect(table.subjuntivo.presente[0]).toBe("tenga");
    expect(table.indicativo.pretéritoPerfectoCompuesto[0]).toBe("he tenido");
  });
});

describe("formsFor (スペイン語)", () => {
  it("法と時制から活用形の6つ組を引く", () => {
    const table = buildConjugation(hablar);
    expect(formsFor(table, "indicativo", "presente")).toBe(table.indicativo.presente);
    expect(formsFor(table, "condicional", "simple")).toBe(table.condicional.simple);
    expect(formsFor(table, "subjuntivo", "presente")).toBe(table.subjuntivo.presente);
  });

  it("知らない法はエラーにする", () => {
    expect(() => formsFor(buildConjugation(hablar), "imperativo", "presente")).toThrow(
      /unknown mood/,
    );
  });
});
