import { describe, expect, it } from "vitest";

import { mergeImportedColumns, normalizeColumns } from "./notebook-columns";

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

describe("mergeImportedColumns", () => {
  it("見出し語の列が既定の名前のままなら、Excelの1列目の名前に書き換え、無い列を後ろに足す", () => {
    expect(mergeImportedColumns(["見出し語", "意味"], ["単語", "意味", "拼音"])).toEqual([
      "単語",
      "意味",
      "拼音",
    ]);
  });

  it("見出し語の列の名前を変えていれば、そのまま残す", () => {
    expect(mergeImportedColumns(["Wort", "意味"], ["単語", "意味", "性"])).toEqual([
      "Wort",
      "意味",
      "性",
    ]);
  });

  it("Excelの1列目の名前が空（列1）なら書き換えない", () => {
    expect(mergeImportedColumns(["見出し語", "意味"], ["列1", "意味"])).toEqual([
      "見出し語",
      "意味",
    ]);
  });

  it("書き換えるとほかの列と同じ名前になるなら書き換えない", () => {
    expect(mergeImportedColumns(["見出し語", "意味", "例"], ["例", "意味"])).toEqual([
      "見出し語",
      "意味",
      "例",
    ]);
  });

  it("列が無い単語帳には、Excelの列をそのまま使う", () => {
    expect(mergeImportedColumns([], ["単語", "意味"])).toEqual(["単語", "意味"]);
  });
});
