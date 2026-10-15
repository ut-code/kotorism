import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./auth-redirect";

describe("safeRedirectPath", () => {
  it("アプリ内の絶対パスはそのまま返す", () => {
    expect(safeRedirectPath("/learn/chinese/05")).toBe("/learn/chinese/05");
    expect(safeRedirectPath("/login?redirect=%2Flearn")).toBe("/login?redirect=%2Flearn");
  });

  it.each([null, "", "learn", "https://evil.com", "//evil.com", "/\\evil.com"])(
    "%j はフォールバックに置き換える",
    (target) => {
      expect(safeRedirectPath(target)).toBe("/my-notebooks");
    },
  );

  it("フォールバックを指定できる", () => {
    expect(safeRedirectPath(null, "/learn")).toBe("/learn");
  });
});
