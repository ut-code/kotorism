import { describe, expect, it } from "vitest";

import { compactRows, groupContinuationRows } from "./card-groups";

describe("compactRows", () => {
  it("どの列も空の組は取り除く（組を消すときは、その組のマスを全部空にする）", () => {
    expect(compactRows([{ 意味: "光" }, {}, { 意味: "軽い" }])).toEqual([
      { 意味: "光" },
      { 意味: "軽い" },
    ]);
  });

  it("全部の組が空なら、空の組を1つだけ残す（見出し語だけの単語）", () => {
    expect(compactRows([{}, {}])).toEqual([{}]);
    expect(compactRows([])).toEqual([{}]);
  });
});

describe("groupContinuationRows", () => {
  it("見出し語が空の行は、すぐ上の単語の新しい組にする", () => {
    expect(
      groupContinuationRows([
        { head: "light", rows: [{ 意味: "光" }] },
        { head: "", rows: [{ 意味: "軽い" }] },
        { head: "", rows: [{ 意味: "明るい" }] },
        { head: "dark", rows: [{ 意味: "暗い" }] },
      ]),
    ).toEqual({
      continuation: [],
      cards: [
        { head: "light", rows: [{ 意味: "光" }, { 意味: "軽い" }, { 意味: "明るい" }] },
        { head: "dark", rows: [{ 意味: "暗い" }] },
      ],
    });
  });

  it("先頭の行の見出し語が空なら、その組は手前（いまある最後の単語）に付ける分として返す", () => {
    expect(
      groupContinuationRows([
        { head: "", rows: [{ 意味: "軽い" }] },
        { head: "dark", rows: [{ 意味: "暗い" }] },
      ]),
    ).toEqual({
      continuation: [{ 意味: "軽い" }],
      cards: [{ head: "dark", rows: [{ 意味: "暗い" }] }],
    });
  });

  it("見出し語の前後の空白だけの行も、見出し語が空とみなす", () => {
    expect(
      groupContinuationRows([
        { head: "light", rows: [{ 意味: "光" }] },
        { head: "  ", rows: [{ 意味: "軽い" }] },
      ]).cards,
    ).toEqual([{ head: "light", rows: [{ 意味: "光" }, { 意味: "軽い" }] }]);
  });
});
