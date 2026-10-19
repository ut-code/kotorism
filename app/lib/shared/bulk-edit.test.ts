import { describe, expect, it } from "vitest";

import { bulkCardFieldName, isBlankCardFields, pickCardFields } from "./bulk-edit";

describe("bulkCardFieldName", () => {
  it("単語ごとの入力欄の名前に、単語のidを前に付ける", () => {
    expect(bulkCardFieldName("abc", "head")).toBe("card:abc:head");
    expect(bulkCardFieldName("abc", "row:0:意味")).toBe("card:abc:row:0:意味");
  });
});

describe("pickCardFields", () => {
  it("まとめて送られた入力欄から、1つの単語ぶんだけを元の名前（head・row:番号:列名）で取り出す", () => {
    const formData = new FormData();
    formData.set("intent", "updateCards");
    formData.set(bulkCardFieldName("a", "head"), "merci");
    formData.set(bulkCardFieldName("a", "row:0:意味"), "ありがとう");
    formData.set(bulkCardFieldName("b", "head"), "bonjour");
    formData.set(bulkCardFieldName("b", "row:0:意味"), "こんにちは");
    formData.set(bulkCardFieldName("b", "row:1:意味"), "おはよう");

    const a = pickCardFields(formData, "a");
    expect([...a.entries()]).toEqual([
      ["head", "merci"],
      ["row:0:意味", "ありがとう"],
    ]);
    const b = pickCardFields(formData, "b");
    expect([...b.entries()]).toEqual([
      ["head", "bonjour"],
      ["row:0:意味", "こんにちは"],
      ["row:1:意味", "おはよう"],
    ]);
  });

  it("id の前方一致で別の単語の入力欄を拾わない", () => {
    const formData = new FormData();
    formData.set(bulkCardFieldName("a", "head"), "merci");
    formData.set(bulkCardFieldName("ab", "head"), "bonjour");
    expect([...pickCardFields(formData, "a").entries()]).toEqual([["head", "merci"]]);
  });
});

describe("isBlankCardFields", () => {
  const fields = (entries: [string, string][]) => {
    const formData = new FormData();
    for (const [name, value] of entries) formData.append(name, value);
    return formData;
  };

  it("見出し語も、ほかの欄も空（空白だけを含む）なら空の行とみなす", () => {
    expect(
      isBlankCardFields(
        fields([
          ["head", ""],
          ["row:0:意味", "  "],
        ]),
      ),
    ).toBe(true);
  });

  it("どれか1つでも入力があれば空の行ではない", () => {
    expect(
      isBlankCardFields(
        fields([
          ["head", ""],
          ["row:0:意味", "こんにちは"],
        ]),
      ),
    ).toBe(false);
    expect(
      isBlankCardFields(
        fields([
          ["head", "merci"],
          ["row:0:意味", ""],
        ]),
      ),
    ).toBe(false);
  });
});
