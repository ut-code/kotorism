import { describe, expect, it } from "vite-plus/test";

import { normalizeCardData } from "./card-data";

describe("normalizeCardData", () => {
  it("最新形式 {head, rows} は空文字や文字列以外の値を落として返す", () => {
    expect(
      normalizeCardData({ head: "chat", rows: [{ 訳: "猫", 発音: "", メモ: 1 }, { 訳: "雌猫" }] }),
    ).toEqual({ head: "chat", rows: [{ 訳: "猫" }, { 訳: "雌猫" }] });
  });

  it("rows が空なら空の組を 1 件持つ", () => {
    expect(normalizeCardData({ head: "a", rows: [] })).toEqual({ head: "a", rows: [{}] });
  });

  it("旧形式 cells は添字で突き合わせて組にする", () => {
    expect(
      normalizeCardData({ head: "chat", cells: { 訳: ["猫", "雌猫"], 発音: ["ʃa"] } }),
    ).toEqual({ head: "chat", rows: [{ 訳: "猫", 発音: "ʃa" }, { 訳: "雌猫" }] });
  });

  it("さらに旧形式 single + senses を組に変換する", () => {
    expect(
      normalizeCardData({
        head: "chat",
        single: { 発音: "ʃa" },
        senses: [{ 訳: "猫" }, { 訳: "雌猫" }],
      }),
    ).toEqual({ head: "chat", rows: [{ 発音: "ʃa", 訳: "猫" }, { 訳: "雌猫" }] });
  });

  it("壊れた入力でも空のカードを返す", () => {
    expect(normalizeCardData(null)).toEqual({ head: "", rows: [{}] });
    expect(normalizeCardData("x")).toEqual({ head: "", rows: [{}] });
  });
});
