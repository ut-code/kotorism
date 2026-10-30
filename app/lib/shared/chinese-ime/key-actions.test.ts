import { describe, expect, it } from "vite-plus/test";

import { imeKeyResult } from "./key-actions";

const key = (k: string, mods: { shiftKey?: boolean; ctrlKey?: boolean } = {}) => ({
  key: k,
  shiftKey: mods.shiftKey ?? false,
  ctrlKey: mods.ctrlKey ?? false,
  altKey: false,
  metaKey: false,
});
const idle = { converting: false, canCycleTone: false, pageStart: 0 };
const converting = { converting: true, canCycleTone: false, pageStart: 0 };

describe("imeKeyResult", () => {
  it("変換していないときは、英字と ' でピンインを打ち始め、ほかのキーは入力欄に任せる", () => {
    expect(imeKeyResult(key("n"), idle)).toEqual({
      kind: "action",
      action: { type: "char", char: "n" },
    });
    expect(imeKeyResult(key("'"), idle)).toEqual({
      kind: "action",
      action: { type: "char", char: "'" },
    });
    for (const k of ["Enter", "ArrowDown", "Escape", "1", " ", "Backspace"]) {
      expect(imeKeyResult(key(k), idle)).toBeNull();
    }
  });

  it("修飾キー（Ctrl など）を押しているときは、ブラウザの操作に任せる", () => {
    expect(imeKeyResult(key("a", { ctrlKey: true }), converting)).toBeNull();
  });

  it("変換中は Space・Enter で確定、Shift+Enter でピンインのまま確定、Esc で取り消す", () => {
    expect(imeKeyResult(key(" "), converting)).toEqual({
      kind: "action",
      action: { type: "space" },
    });
    expect(imeKeyResult(key("Enter"), converting)).toEqual({
      kind: "action",
      action: { type: "enter" },
    });
    expect(imeKeyResult(key("Enter", { shiftKey: true }), converting)).toEqual({
      kind: "action",
      action: { type: "commit_raw" },
    });
    expect(imeKeyResult(key("Escape"), converting)).toEqual({
      kind: "action",
      action: { type: "escape" },
    });
  });

  it("変換中の数字は、いま見えているページの中の番号の候補を選ぶ", () => {
    expect(imeKeyResult(key("2"), { ...converting, pageStart: 6 })).toEqual({
      kind: "action",
      action: { type: "select", index: 7 },
    });
  });

  it("変換中の ↑↓ は、母音の直後なら声調の切り替え、そうでなければ音節の移動", () => {
    expect(imeKeyResult(key("ArrowUp"), { ...converting, canCycleTone: true })).toEqual({
      kind: "action",
      action: { type: "tone", direction: 1 },
    });
    expect(imeKeyResult(key("ArrowDown"), converting)).toEqual({
      kind: "action",
      action: { type: "arrow_right" },
    });
  });

  it("変換中の Tab で候補を移り、= / - でページを送る", () => {
    expect(imeKeyResult(key("Tab", { shiftKey: true }), converting)).toEqual({
      kind: "action",
      action: { type: "prev_candidate" },
    });
    expect(imeKeyResult(key("="), converting)).toEqual({ kind: "page", delta: 1 });
    expect(imeKeyResult(key("PageUp"), converting)).toEqual({ kind: "page", delta: -1 });
  });

  it("変換中にほかの文字（句読点など）を打つと、変換を確定してからその文字を入れる", () => {
    expect(imeKeyResult(key(","), converting)).toEqual({ kind: "commitThenPass" });
    expect(imeKeyResult(key("Shift"), converting)).toBeNull();
  });
});
