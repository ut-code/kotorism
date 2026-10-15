import { describe, expect, it } from "vitest";

import { normalizeColumns } from "./notebook-columns";

describe("normalizeColumns", () => {
  it("文字列の配列はそのまま返す", () => {
    expect(normalizeColumns(["訳", "発音"])).toEqual(["訳", "発音"]);
  });

  it("過去の {name, repeatable} 形式は名前だけを取り出す", () => {
    expect(normalizeColumns([{ name: "訳", repeatable: true }, "発音"])).toEqual(["訳", "発音"]);
  });

  it("配列でなければ空配列", () => {
    expect(normalizeColumns(null)).toEqual([]);
    expect(normalizeColumns({ name: "訳" })).toEqual([]);
  });
});
