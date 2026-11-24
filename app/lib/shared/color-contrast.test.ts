import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { contrastRatio } from "./color-contrast";

describe("contrastRatio", () => {
  it("白と黒は 21、同じ色どうしは 1", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ff8877", "#ff8877")).toBeCloseTo(1, 5);
  });

  it("引数の順序によらない", () => {
    expect(contrastRatio("#167e82", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#167e82"),
      10,
    );
  });
});

// globals.css のボタン用の色（--button-*）は白文字を載せるので、どれも白とのコントラスト比 4.5 以上にする
describe("globals.css のボタン色", () => {
  const css = readFileSync(new URL("../../globals.css", import.meta.url), "utf8");
  const buttonColors = [...css.matchAll(/--(button-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map(
    ([, name, hex]) => ({
      name,
      hex,
    }),
  );

  it("ボタン色が定義されている", () => {
    expect(buttonColors.map((c) => c.name)).toEqual(
      expect.arrayContaining(["button-notebook", "button-learn"]),
    );
  });

  it.each(buttonColors)("$name ($hex) は白文字とのコントラスト比が 4.5 以上", ({ hex }) => {
    expect(contrastRatio(hex, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
