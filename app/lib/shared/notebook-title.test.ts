import { describe, expect, it } from "vitest";

import { NOTEBOOK_TITLE_MAX_LENGTH } from "./notebook-schema";
import { datedTitle, numberedTitle } from "./notebook-title";

describe("numberedTitle", () => {
  it("名前の後ろに、1から順に空いている番号を付ける", () => {
    expect(numberedTitle("フランス語", ["フランス語"])).toBe("フランス語 1");
    expect(numberedTitle("フランス語", ["フランス語", "フランス語 1", "フランス語 2"])).toBe(
      "フランス語 3",
    );
    expect(numberedTitle("フランス語", ["フランス語", "フランス語 2"])).toBe("フランス語 1");
  });

  it("番号を付けるとタイトルの上限を超えるときは、名前の末尾を削って収める", () => {
    const long = "あ".repeat(NOTEBOOK_TITLE_MAX_LENGTH);
    const result = numberedTitle(long, [long]);
    expect(result.length).toBeLessThanOrEqual(NOTEBOOK_TITLE_MAX_LENGTH);
    expect(result.endsWith(" 1")).toBe(true);
  });
});

describe("datedTitle", () => {
  it("名前の後ろに、今日の日付を付ける", () => {
    expect(datedTitle("フランス語", "2026-10-19", ["フランス語"])).toBe("フランス語 2026-10-19");
  });

  it("日付を付けた名前もすでにあれば、さらに番号を付ける", () => {
    expect(datedTitle("フランス語", "2026-10-19", ["フランス語", "フランス語 2026-10-19"])).toBe(
      "フランス語 2026-10-19 1",
    );
  });
});
