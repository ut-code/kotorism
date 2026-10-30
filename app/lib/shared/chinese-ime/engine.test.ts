import { describe, expect, it } from "vite-plus/test";

import { canCycleTone, commitAll, createImeState, handleImeAction } from "./engine";

describe("ImeEngine", () => {
  it("アルファベットを入力すると音節分割され、候補が生成される", () => {
    let state = createImeState();
    state = handleImeAction(state, { type: "char", char: "n" });
    state = handleImeAction(state, { type: "char", char: "i" });

    expect(state.rawInput).toBe("ni");
    expect(state.candidates.length).toBeGreaterThan(0);
    expect(state.candidates[0].text).toBe("你");
    expect(state.committedText).toBeNull();
  });

  it("続けて入力すると単語候補（最長一致）が上位に来る（nihao → 你好）", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    expect(state.rawInput).toBe("nihao");
    expect(state.candidates[0].text).toBe("你好");
    expect(state.candidates[0].syllableCount).toBe(2);
    // 続けて1字の候補（你など）も含まれている
    expect(state.candidates.some((c) => c.text === "你" && c.syllableCount === 1)).toBe(true);
  });

  it("スペースキーを押すと、先頭の候補が確定される", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    state = handleImeAction(state, { type: "space" });
    expect(state.committedText).toBe("你好");
    // 全音節が消費されたので、入力バッファは空になる
    expect(state.rawInput).toBe("");
    expect(state.candidates).toEqual([]);
  });

  it("数字キーで1字候補を選ぶと、残りのピンインが続けて変換される", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    // 候補一覧の中で「你」（1音節消費）の番号を探す
    const niIndex = state.candidates.findIndex((c) => c.text === "你" && c.syllableCount === 1);
    expect(niIndex).toBeGreaterThan(-1);

    // 数字キーは 1-indexed (例: index 1 なら digit 2)
    state = handleImeAction(state, { type: "digit", digit: niIndex + 1 });
    expect(state.committedText).toBe("你");
    // 残りのピンイン "hao" が残って継続変換中になる
    expect(state.rawInput).toBe("hao");
    expect(state.candidates.length).toBeGreaterThan(0);
    expect(state.candidates[0].text).toBe("好");

    // 残りの "hao" をスペースで確定
    state = handleImeAction(state, { type: "space" });
    expect(state.committedText).toBe("好");
    expect(state.rawInput).toBe("");
  });

  it("文単位の変換ができる（woshiribenren → 我是日本人）", () => {
    let state = createImeState();
    for (const c of "woshiribenren") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    expect(state.candidates.length).toBeGreaterThan(0);
    // 1番目の候補は文全体の変換「我是日本人」
    expect(state.candidates[0].text).toBe("我是日本人");
    expect(state.candidates[0].syllableCount).toBe(5);

    // スペースキー1回で文全体を確定
    state = handleImeAction(state, { type: "space" });
    expect(state.committedText).toBe("我是日本人");
    expect(state.rawInput).toBe("");
  });

  it("Enterキーで選択中の候補（漢字）を確定する", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    state = handleImeAction(state, { type: "enter" });
    expect(state.committedText).toBe("你好");
    expect(state.rawInput).toBe("");
  });

  it("Enterキーは候補を移動していれば、その候補を確定する", () => {
    let state = createImeState();
    for (const c of "ma") state = handleImeAction(state, { type: "char", char: c });
    state = handleImeAction(state, { type: "arrow_right" });
    const second = state.candidates[1].text;

    state = handleImeAction(state, { type: "enter" });
    expect(state.committedText).toBe(second);
  });

  it("commit_raw（Shift+Enter）で入力中のアルファベットをそのまま確定する", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }

    state = handleImeAction(state, { type: "commit_raw" });
    expect(state.committedText).toBe("nihao");
    expect(state.rawInput).toBe("");
  });

  it("候補がなければ Enter でもアルファベットのまま確定する", () => {
    let state = createImeState();
    for (const c of "zzz") state = handleImeAction(state, { type: "char", char: c });
    expect(state.candidates).toHaveLength(0);

    state = handleImeAction(state, { type: "enter" });
    expect(state.committedText).toBe("zzz");
  });

  it("Backspaceキーで末尾文字を削除し、空になるとリセットされる", () => {
    let state = createImeState();
    state = handleImeAction(state, { type: "char", char: "n" });
    state = handleImeAction(state, { type: "char", char: "i" });
    expect(state.rawInput).toBe("ni");

    state = handleImeAction(state, { type: "backspace" });
    expect(state.rawInput).toBe("n");

    state = handleImeAction(state, { type: "backspace" });
    expect(state.rawInput).toBe("");
    expect(state.candidates).toEqual([]);
  });

  it("矢印キーで候補選択を移動できる", () => {
    let state = createImeState();
    for (const c of "nihao") {
      state = handleImeAction(state, { type: "char", char: c });
    }
    expect(state.selectedIndex).toBe(0);

    state = handleImeAction(state, { type: "arrow_right" });
    expect(state.selectedIndex).toBe(1);

    state = handleImeAction(state, { type: "arrow_left" });
    expect(state.selectedIndex).toBe(0);
  });
});

describe("声調記号の入力（↑ / ↓）", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };

  it("母音の直後に ↑ を押すたびに a → ā → á → ǎ → à と切り替わる", () => {
    let state = typeAll("ha");
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      state = handleImeAction(state, { type: "tone", direction: 1 });
      seen.push(state.rawInput);
    }
    expect(seen).toEqual(["hā", "há", "hǎ", "hà", "ha"]);
  });

  it("↓ は逆向きに切り替わる", () => {
    const state = handleImeAction(typeAll("ma"), { type: "tone", direction: -1 });
    expect(state.rawInput).toBe("mà");
  });

  it("声調記号は最後の音節の正しい母音に付く（mai → mài、gui → guī）", () => {
    const up = (input: string, times: number) => {
      let state = typeAll(input);
      for (let i = 0; i < times; i++)
        state = handleImeAction(state, { type: "tone", direction: 1 });
      return state.rawInput;
    };
    expect(up("mai", 4)).toBe("mài");
    expect(up("mai", 5)).toBe("mai");
    expect(up("gou", 3)).toBe("gǒu");
    expect(up("gui", 1)).toBe("guī");
    expect(up("nihao", 3)).toBe("nihǎo");
    expect(handleImeAction(typeAll("xie"), { type: "tone", direction: -1 }).rawInput).toBe("xiè");
  });

  it("v（ü）にも声調記号を付けられる", () => {
    const state = handleImeAction(typeAll("lv"), { type: "tone", direction: 1 });
    expect(state.rawInput).toBe("lǖ");
  });

  it("声調記号付きでも、声調なしと同じ候補に変換される", () => {
    let state = typeAll("ni");
    state = handleImeAction(state, { type: "tone", direction: -1 });
    state = handleImeAction(state, { type: "tone", direction: -1 });
    for (const c of "ha") state = handleImeAction(state, { type: "char", char: c });
    state = handleImeAction(state, { type: "tone", direction: 1 });
    state = handleImeAction(state, { type: "tone", direction: 1 });
    state = handleImeAction(state, { type: "tone", direction: 1 });
    state = handleImeAction(state, { type: "char", char: "o" });

    expect(state.rawInput).toBe("nǐhǎo");
    expect(state.segments.map((s) => s.text)).toEqual(["ni", "hao"]);
    expect(state.candidates[0].text).toBe(typeAll("nihao").candidates[0].text);
  });

  it("commit_raw では声調記号付きのピンインのまま確定する", () => {
    let state = handleImeAction(typeAll("ma"), { type: "tone", direction: 1 });
    state = handleImeAction(state, { type: "commit_raw" });
    expect(state.committedText).toBe("mā");
  });

  it("末尾が母音でなければ何も変わらない（canCycleTone が false）", () => {
    const state = typeAll("han");
    expect(canCycleTone(state)).toBe(false);
    expect(handleImeAction(state, { type: "tone", direction: 1 }).rawInput).toBe("han");
    expect(canCycleTone(typeAll("ha"))).toBe(true);
    expect(canCycleTone(createImeState())).toBe(false);
  });
});

describe("声調記号付きの母音のボタン", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };

  it("声調記号付きの母音や ü も入力バッファに入り、声調なしと同じ候補に変換される", () => {
    const state = typeAll("nǐhǎo");
    expect(state.rawInput).toBe("nǐhǎo");
    expect(state.segments.map((s) => s.text)).toEqual(["ni", "hao"]);
    expect(state.candidates[0].text).toBe(typeAll("nihao").candidates[0].text);
  });

  it("ü は v と同じ音節として区切る", () => {
    expect(typeAll("lǜ").segments.map((s) => s.text)).toEqual(["lv"]);
    expect(typeAll("nü").segments.map((s) => s.text)).toEqual(["nv"]);
  });

  it("ピンインに使わない文字は入らない", () => {
    expect(typeAll("né").rawInput).toBe("né");
    expect(typeAll("n1").rawInput).toBe("n");
    expect(typeAll("nç").rawInput).toBe("n");
  });
});

describe("最後の音節の声調を指定する（スマホのキーパッド）", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };
  const setTone = (input: string, tone: 0 | 1 | 2 | 3 | 4) =>
    handleImeAction(typeAll(input), { type: "set_tone", tone }).rawInput;

  it("最後の音節の、声調記号を付けるべき母音に付ける（a・e が優先）", () => {
    expect(setTone("nihao", 3)).toBe("nihǎo");
    expect(setTone("xie", 4)).toBe("xiè");
    expect(setTone("ma", 1)).toBe("mā");
  });

  it("ou は o に、それ以外は最後の母音に付ける", () => {
    expect(setTone("dou", 1)).toBe("dōu");
    expect(setTone("gui", 4)).toBe("guì");
    expect(setTone("liu", 2)).toBe("liú");
    expect(setTone("lv", 3)).toBe("lǚ");
  });

  it("すでに声調が付いていれば付け替え、0（軽声）で外す", () => {
    let state = handleImeAction(typeAll("nihao"), { type: "set_tone", tone: 3 });
    state = handleImeAction(state, { type: "set_tone", tone: 4 });
    expect(state.rawInput).toBe("nihào");
    state = handleImeAction(state, { type: "set_tone", tone: 0 });
    expect(state.rawInput).toBe("nihao");
  });

  it("声調を付けても同じ候補に変換される", () => {
    const state = handleImeAction(typeAll("nihao"), { type: "set_tone", tone: 3 });
    expect(state.candidates[0].text).toBe("你好");
  });

  it("母音がない・入力が空なら何も変わらない", () => {
    expect(setTone("n", 1)).toBe("n");
    expect(handleImeAction(createImeState(), { type: "set_tone", tone: 1 }).rawInput).toBe("");
  });
});

describe("commitAll（句読点を押したとき、変換中のピンインをすべて確定する）", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };

  it("選択中の候補で最後まで確定した文字列を返す", () => {
    expect(commitAll(typeAll("nihao"))).toBe("你好");
  });

  it("候補で一部しか消費しなくても、残りも続けて確定する", () => {
    let state = typeAll("nihao");
    const single = state.candidates.findIndex((c) => c.text === "你" && c.syllableCount === 1);
    state = { ...state, selectedIndex: single };
    expect(commitAll(state)).toBe(`你${typeAll("hao").candidates[0].text}`);
  });

  it("変換中でなければ空文字列", () => {
    expect(commitAll(createImeState())).toBe("");
  });
});

describe("声調が一致する候補を前に出す", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };
  const withTone = (input: string, tone: 0 | 1 | 2 | 3 | 4) =>
    handleImeAction(typeAll(input), { type: "set_tone", tone }).candidates.map((c) => c.text);

  it("声調を付けると、その声調で読む字が先頭に来る", () => {
    expect(withTone("ma", 3)[0]).toBe("马");
    expect(withTone("ma", 1)[0]).toBe("妈");
    expect(withTone("mai", 4)[0]).toBe("卖");
  });

  it("声調が一致する字は、声調が違う字より前に並ぶ（違う字も候補から消えない）", () => {
    const shi2 = withTone("shi", 2);
    expect(shi2.indexOf("十")).toBeLessThan(shi2.indexOf("是"));
    expect(shi2.indexOf("时")).toBeLessThan(shi2.indexOf("是"));
    expect(shi2).toHaveLength(typeAll("shi").candidates.length);
  });

  it("多音字はほかの読みでも一致とみなすが、主な読みで一致する字を優先する（mǎ → 马 > 吗）", () => {
    const ma3 = withTone("ma", 3);
    expect(ma3.indexOf("马")).toBeLessThan(ma3.indexOf("吗"));
    expect(ma3.indexOf("吗")).toBeLessThan(ma3.indexOf("妈"));
  });

  it("複数音節の単語は、声調を付けた音節がすべて一致すれば前に来る", () => {
    let state = typeAll("mai");
    state = handleImeAction(state, { type: "set_tone", tone: 4 });
    expect(state.candidates[0].text).toBe("卖");
    expect(
      handleImeAction(typeAll("nihao"), { type: "set_tone", tone: 3 }).candidates[0].text,
    ).toBe("你好");
  });

  it("声調を付けなければ並びは変わらない", () => {
    const plain = typeAll("shi").candidates.map((c) => c.text);
    expect(withTone("shi", 0)).toEqual(plain);
  });
});

describe("候補の移動（Tab / Shift+Tab）", () => {
  const typeAll = (input: string) => {
    let state = createImeState();
    for (const c of input) state = handleImeAction(state, { type: "char", char: c });
    return state;
  };

  it("next_candidate で次へ、最後の次は先頭に戻る", () => {
    let state = typeAll("mai");
    const count = state.candidates.length;
    state = handleImeAction(state, { type: "next_candidate" });
    expect(state.selectedIndex).toBe(1);
    for (let i = 1; i < count; i++) state = handleImeAction(state, { type: "next_candidate" });
    expect(state.selectedIndex).toBe(0);
  });

  it("prev_candidate で前へ、先頭の前は最後に戻る", () => {
    let state = typeAll("mai");
    state = handleImeAction(state, { type: "prev_candidate" });
    expect(state.selectedIndex).toBe(state.candidates.length - 1);
    state = handleImeAction(state, { type: "prev_candidate" });
    expect(state.selectedIndex).toBe(state.candidates.length - 2);
  });
});
