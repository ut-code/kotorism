import { describe, expect, it } from "vitest";

import { buildAccentIndex, cycleAccent, cycleCharBeforeCaret, insertAtSelection } from "./accent";

describe("buildAccentIndex", () => {
  it("小文字・大文字のアクセント文字を同じ順序のサイクルに登録する", () => {
    const index = buildAccentIndex([["e", "é", "è"]]);

    expect(index.get("e")).toEqual({ cycle: ["e", "é", "è"], index: 0 });
    expect(index.get("É")).toEqual({ cycle: ["E", "É", "È"], index: 1 });
  });

  it("大文字化で複数文字になる ß は大文字サイクルに登録しない", () => {
    const index = buildAccentIndex([["s", "ß"]]);

    expect(index.has("ß")).toBe(true);
    expect(index.has("SS")).toBe(false);
  });

  it("重複する文字は最初のサイクルを維持する", () => {
    const index = buildAccentIndex([
      ["u", "ü"],
      ["u", "ú"],
    ]);

    expect(index.get("u")).toEqual({ cycle: ["u", "ü"], index: 0 });
  });
});

describe("cycleAccent", () => {
  const index = buildAccentIndex([["e", "é", "è"]]);

  it("次・前の文字へ進み、サイクルの端で折り返す", () => {
    expect(cycleAccent(index, "e", 1)).toBe("é");
    expect(cycleAccent(index, "è", 1)).toBe("e");
    expect(cycleAccent(index, "e", -1)).toBe("è");
    expect(cycleAccent(index, "é", -1)).toBe("e");
  });

  it("空文字やサイクルにない文字は変更しない", () => {
    expect(cycleAccent(index, undefined, 1)).toBeNull();
    expect(cycleAccent(index, "", -1)).toBeNull();
    expect(cycleAccent(index, "x", 1)).toBeNull();
  });
});

describe("cycleCharBeforeCaret", () => {
  const index = buildAccentIndex([["e", "é", "è"]]);

  it("カーソル直前の文字を切り替え、カーソル位置は変えない", () => {
    expect(cycleCharBeforeCaret(index, "Je mange", 2, 1)).toEqual({
      value: "Jé mange",
      caret: 2,
    });
    expect(cycleCharBeforeCaret(index, "Je", 2, -1)).toEqual({
      value: "Jè",
      caret: 2,
    });
  });

  it("先頭にいるときや直前の文字が切り替えられないときは null", () => {
    expect(cycleCharBeforeCaret(index, "Je", 0, 1)).toBeNull();
    expect(cycleCharBeforeCaret(index, "Je ", 3, 1)).toBeNull();
  });
});

describe("insertAtSelection", () => {
  it("カーソル位置に文字を入れ、カーソルを入れた文字の後ろへ進める", () => {
    expect(insertAtSelection("ca va", 1, 1, "ç")).toEqual({
      value: "cça va",
      caret: 2,
    });
  });

  it("選択範囲は入れた文字で置き換える", () => {
    expect(insertAtSelection("ca va", 0, 1, "ç")).toEqual({
      value: "ça va",
      caret: 1,
    });
  });
});
