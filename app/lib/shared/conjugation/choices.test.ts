import { describe, expect, it } from "vitest";

import { conjugationChoices } from "./choices";

describe("conjugationChoices", () => {
  it("正解を含む、重複のない4つの選択肢を作る", () => {
    const choices = conjugationChoices(
      "parles",
      ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
      [],
    );
    expect(choices).toHaveLength(4);
    expect(choices).toContain("parles");
    expect(new Set(choices).size).toBe(4);
  });

  it("正解と同じ綴りの別人称の形は、誤答の選択肢にしない", () => {
    // je parle と il parle は同じ綴り
    const choices = conjugationChoices(
      "parle",
      ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
      [],
    );
    expect(choices.filter((c) => c === "parle")).toHaveLength(1);
    expect(choices).toHaveLength(4);
  });

  it("同じ時制の形が足りないときは、同じ人称の別の時制の形で埋める", () => {
    const choices = conjugationChoices(
      "a",
      ["ai", "as", "a", "a", "a", "a"],
      ["avait", "aura", "a"],
    );
    expect(choices).toHaveLength(4);
    expect(choices).toEqual(expect.arrayContaining(["a", "ai", "as"]));
    expect(["avait", "aura"]).toContain(choices.find((c) => !["a", "ai", "as"].includes(c)));
  });

  it("同じ時制の別人称の形を優先して誤答にする", () => {
    const choices = conjugationChoices(
      "parlons",
      ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
      ["parlions", "parlerons", "parlais"],
    );
    for (const c of choices) {
      expect(["parle", "parles", "parlons", "parlez", "parlent"]).toContain(c);
    }
  });

  it("候補が足りなければ、ある分だけで選択肢を作る", () => {
    expect(conjugationChoices("x", ["x", "x", "y"], []).sort()).toEqual(["x", "y"]);
  });
});
