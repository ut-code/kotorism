import { describe, expect, it } from "vite-plus/test";

import { NOTEBOOK_CATEGORY } from "./study-events";
import { OTHER_MATERIAL_COLOR, materialColors } from "./material-colors";

const material = (key: string, category: string, seconds: number) => ({ key, category, seconds });

describe("materialColors", () => {
  it("My単語帳は coral、学習教材は tealblue で塗る（学習時間の順位に関係なく）", () => {
    const colors = materialColors([
      material("deck:a", NOTEBOOK_CATEGORY, 600),
      material("section:french:01", "フランス語", 300),
    ]);
    expect(colors.get("deck:a")).toBe("var(--chart-notebook-1)");
    expect(colors.get("section:french:01")).toBe("var(--chart-learn-1)");

    const reversed = materialColors([
      material("section:french:01", "フランス語", 600),
      material("deck:a", NOTEBOOK_CATEGORY, 300),
    ]);
    expect(reversed.get("deck:a")).toBe("var(--chart-notebook-1)");
    expect(reversed.get("section:french:01")).toBe("var(--chart-learn-1)");
  });

  it("同じ種類の教材が複数あれば、学習時間の多い順に同じ系統の別の濃さを割り当てる", () => {
    const colors = materialColors([
      material("deck:a", NOTEBOOK_CATEGORY, 600),
      material("section:french:01", "フランス語", 500),
      material("deck:b", NOTEBOOK_CATEGORY, 400),
      material("essay:german", "ドイツ語", 300),
    ]);
    expect(colors.get("deck:a")).toBe("var(--chart-notebook-1)");
    expect(colors.get("deck:b")).toBe("var(--chart-notebook-2)");
    expect(colors.get("section:french:01")).toBe("var(--chart-learn-1)");
    expect(colors.get("essay:german")).toBe("var(--chart-learn-2)");
  });

  it("同じ種類で4つを超えた分と、学習時間の無い教材は「その他」の色にする", () => {
    const decks = [1, 2, 3, 4, 5].map((n) => material(`deck:${n}`, NOTEBOOK_CATEGORY, 100 - n));
    const colors = materialColors([...decks, material("deck:zero", NOTEBOOK_CATEGORY, 0)]);
    expect(colors.get("deck:4")).toBe("var(--chart-notebook-4)");
    expect(colors.get("deck:5")).toBe(OTHER_MATERIAL_COLOR);
    expect(colors.get("deck:zero")).toBeUndefined();
  });
});
