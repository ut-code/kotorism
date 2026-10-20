import { describe, expect, it } from "vitest";

import {
  compactRows,
  expandMergedValues,
  groupContinuationRows,
  initialMergedUp,
  mergeSpans,
  mergeWithNext,
  splitLast,
} from "./card-groups";

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

const columns = ["意味", "品詞"];

describe("initialMergedUp", () => {
  it("同じ値が続くマスは、1つ上の組のマスと結合済みとする（表示中の結合と同じ基準）", () => {
    expect(
      initialMergedUp(
        [
          { 意味: "値段が～である", 品詞: "動詞" },
          { 意味: "犠牲", 品詞: "名詞" },
          { 意味: "費用", 品詞: "名詞" },
        ],
        columns,
      ),
    ).toEqual([
      { 意味: false, 品詞: false },
      { 意味: false, 品詞: false },
      { 意味: false, 品詞: true },
    ]);
  });

  it("空のマス同士は結合しない", () => {
    expect(initialMergedUp([{}, {}], columns)).toEqual([
      { 意味: false, 品詞: false },
      { 意味: false, 品詞: false },
    ]);
  });
});

describe("mergeSpans", () => {
  it("結合の先頭のマスは結合した組の数、結合されたマスは0を返す", () => {
    const mergedUp = [{ 意味: false }, { 意味: true }, { 意味: true }, { 意味: false }];
    expect(mergeSpans(mergedUp, "意味")).toEqual([3, 0, 0, 1]);
  });
});

describe("mergeWithNext", () => {
  it("結合の先頭から数えて、そのすぐ下の組のマスを結合する", () => {
    const mergedUp = [{ 意味: false }, { 意味: true }, { 意味: false }];
    expect(mergeWithNext(mergedUp, 0, "意味")).toEqual([
      { 意味: false },
      { 意味: true },
      { 意味: true },
    ]);
  });

  it("下に組が無ければ何もしない", () => {
    const mergedUp = [{ 意味: false }, { 意味: true }];
    expect(mergeWithNext(mergedUp, 0, "意味")).toEqual(mergedUp);
  });
});

describe("splitLast", () => {
  it("結合のいちばん下の組のマスだけを切り離す", () => {
    const mergedUp = [{ 意味: false }, { 意味: true }, { 意味: true }];
    expect(splitLast(mergedUp, 0, "意味")).toEqual([
      { 意味: false },
      { 意味: true },
      { 意味: false },
    ]);
  });

  it("結合していないマスでは何もしない", () => {
    const mergedUp = [{ 意味: false }, { 意味: false }];
    expect(splitLast(mergedUp, 0, "意味")).toEqual(mergedUp);
  });
});

describe("expandMergedValues", () => {
  it("結合されたマスには、結合の先頭のマスの値を入れる", () => {
    expect(
      expandMergedValues(
        [{ 意味: "光", 品詞: "名詞" }, { 意味: "軽い", 品詞: "形容詞" }, { 意味: "明るい" }],
        [
          { 意味: false, 品詞: false },
          { 意味: false, 品詞: false },
          { 意味: false, 品詞: true },
        ],
        columns,
      ),
    ).toEqual([
      { 意味: "光", 品詞: "名詞" },
      { 意味: "軽い", 品詞: "形容詞" },
      { 意味: "明るい", 品詞: "形容詞" },
    ]);
  });
});
