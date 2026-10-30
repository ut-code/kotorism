import { describe, expect, it } from "vite-plus/test";

import { buildConjugation } from "./engine";
import { formsFor, type RegularVerb, type VerbEntry } from "./types";

const lernen: RegularVerb = {
  id: "lernen",
  infinitive: "lernen",
  meaning: "学ぶ",
  kind: "regular",
  auxiliary: "haben",
};

const gehen: VerbEntry = {
  id: "gehen",
  infinitive: "gehen",
  meaning: "行く",
  kind: "irregular",
  auxiliary: "sein",
  präsens: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
  präteritum: ["ging", "gingst", "ging", "gingen", "gingt", "gingen"],
  partizipII: "gegangen",
  konjunktivIIBase: "ging",
};

describe("buildConjugation (ドイツ語・弱変化動詞)", () => {
  it("lernen の現在・過去・接続法を語尾のルールから作る", () => {
    const table = buildConjugation(lernen);
    expect(table.indikativ.präsens).toEqual([
      "lerne",
      "lernst",
      "lernt",
      "lernen",
      "lernt",
      "lernen",
    ]);
    expect(table.indikativ.präteritum).toEqual([
      "lernte",
      "lerntest",
      "lernte",
      "lernten",
      "lerntet",
      "lernten",
    ]);
    // 弱変化動詞の接続法II式は過去形と同形になる
    expect(table.konjunktivII.präsens).toEqual(table.indikativ.präteritum);
    expect(table.konjunktivI.präsens).toEqual([
      "lerne",
      "lernest",
      "lerne",
      "lernen",
      "lernet",
      "lernen",
    ]);
  });

  it("複合時制は助動詞 haben + 過去分詞(ge-...-t)で作る", () => {
    const table = buildConjugation(lernen);
    expect(table.indikativ.perfekt[0]).toBe("habe gelernt");
    expect(table.indikativ.plusquamperfekt[2]).toBe("hatte gelernt");
    expect(table.indikativ.futurI[1]).toBe("wirst lernen");
    expect(table.indikativ.futurII[0]).toBe("werde gelernt haben");
    expect(table.konjunktivII.perfekt[0]).toBe("hätte gelernt");
    expect(table.konjunktivI.perfekt[0]).toBe("habe gelernt");
  });

  it("語幹が d/t で終わる動詞は連結母音 -e- を挟む", () => {
    const table = buildConjugation({
      ...lernen,
      id: "arbeiten",
      infinitive: "arbeiten",
      linkingE: true,
    });
    expect(table.indikativ.präsens).toEqual([
      "arbeite",
      "arbeitest",
      "arbeitet",
      "arbeiten",
      "arbeitet",
      "arbeiten",
    ]);
    expect(table.indikativ.präteritum[1]).toBe("arbeitetest");
    expect(table.indikativ.perfekt[0]).toBe("habe gearbeitet");
  });

  it("歯擦音で終わる語幹は du の語尾が -t になる", () => {
    const table = buildConjugation({
      ...lernen,
      id: "reisen",
      infinitive: "reisen",
      auxiliary: "sein",
      sibilantStem: true,
    });
    expect(table.indikativ.präsens[1]).toBe("reist");
    expect(table.indikativ.perfekt[0]).toBe("bin gereist");
    expect(table.indikativ.futurII[0]).toBe("werde gereist sein");
  });

  it("ge- を付けない動詞(-ieren など)は過去分詞がそのまま -t で終わる", () => {
    const table = buildConjugation({
      ...lernen,
      id: "studieren",
      infinitive: "studieren",
      noGePrefix: true,
    });
    expect(table.indikativ.perfekt[0]).toBe("habe studiert");
  });
});

describe("buildConjugation (ドイツ語・強変化動詞)", () => {
  it("明示された現在・過去の活用形をそのまま使う", () => {
    const table = buildConjugation(gehen);
    expect(table.indikativ.präsens[1]).toBe("gehst");
    expect(table.indikativ.präteritum[3]).toBe("gingen");
  });

  it("sein 支配の動詞は完了時制の助動詞が sein になる", () => {
    const table = buildConjugation(gehen);
    expect(table.indikativ.perfekt[0]).toBe("bin gegangen");
    expect(table.indikativ.plusquamperfekt[0]).toBe("war gegangen");
    expect(table.indikativ.futurII[0]).toBe("werde gegangen sein");
    expect(table.konjunktivII.perfekt[0]).toBe("wäre gegangen");
    expect(table.konjunktivI.perfekt[0]).toBe("sei gegangen");
  });

  it("接続法II式は konjunktivIIBase に語尾を付けて作る", () => {
    const table = buildConjugation(gehen);
    expect(table.konjunktivII.präsens).toEqual([
      "ginge",
      "gingest",
      "ginge",
      "gingen",
      "ginget",
      "gingen",
    ]);
  });

  it("接続法I式は原形から導き、上書きがあればそれを優先する", () => {
    expect(buildConjugation(gehen).konjunktivI.präsens[1]).toBe("gehest");

    // 原形が -n だけで終わる動詞(tun, sein)は語幹から n 1文字だけを落とす
    const tun = buildConjugation({ ...gehen, id: "tun", infinitive: "tun" });
    expect(tun.konjunktivI.präsens[0]).toBe("tue");

    const override = ["sei", "seist", "sei", "seien", "seiet", "seien"] as const;
    const sein = buildConjugation({ ...gehen, konjunktivIOverride: [...override] });
    expect(sein.konjunktivI.präsens).toEqual(override);
  });
});

describe("formsFor (ドイツ語)", () => {
  it("法と時制から活用形の6つ組を引く", () => {
    const table = buildConjugation(lernen);
    expect(formsFor(table, "indikativ", "perfekt")).toBe(table.indikativ.perfekt);
    expect(formsFor(table, "konjunktivII", "präsens")).toBe(table.konjunktivII.präsens);
    expect(formsFor(table, "konjunktivI", "präsens")).toBe(table.konjunktivI.präsens);
  });

  it("知らない法はエラーにする", () => {
    expect(() => formsFor(buildConjugation(lernen), "imperativ", "präsens")).toThrow(
      /unknown mood/,
    );
  });
});
