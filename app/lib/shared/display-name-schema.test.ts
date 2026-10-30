import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH, parseDisplayName } from "./display-name-schema";

describe("parseDisplayName", () => {
  it("前後の空白を除いた名前を返す", () => {
    expect(parseDisplayName("  たなか  ")).toEqual({ success: true, data: "たなか" });
  });

  it.each([undefined, null, "", "   "])("%j は空なので受け付けない", (input) => {
    expect(parseDisplayName(input)).toEqual({ success: false, error: "名前を入力してください。" });
  });

  it("上限ちょうどは受け付け、超えると受け付けない", () => {
    expect(parseDisplayName("あ".repeat(DISPLAY_NAME_MAX_LENGTH)).success).toBe(true);
    expect(parseDisplayName("あ".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toEqual({
      success: false,
      error: `名前は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください。`,
    });
  });
});
