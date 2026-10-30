import { describe, expect, it } from "vite-plus/test";

import { pickVerbs } from "./shared";

const verb = (id: string) => ({ id, infinitive: id, meaning: id });

describe("pickVerbs", () => {
  it("指定した ID の動詞だけを、指定した順に返す", () => {
    const all = [verb("a"), verb("b"), verb("c")];
    expect(pickVerbs(all, ["c", "a"]).map((v) => v.id)).toEqual(["c", "a"]);
  });

  it("存在しない ID を指定すると例外を投げる（ID の打ち間違いに気づけるように）", () => {
    expect(() => pickVerbs([verb("a")], ["a", "x"])).toThrow(/x/);
  });
});
