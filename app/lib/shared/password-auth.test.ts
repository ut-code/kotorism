import { describe, expect, it } from "vitest";

import { passwordAuthEnabled } from "./password-auth";

describe("passwordAuthEnabled", () => {
  it("未設定ならパスワード認証は無効", () => {
    expect(passwordAuthEnabled({})).toBe(false);
  });

  it("PASSWORD_SIGNUP=true なら有効", () => {
    expect(passwordAuthEnabled({ PASSWORD_SIGNUP: "true" })).toBe(true);
  });

  it("移行期間用だった PASSWORD_LOGIN=true が残っていても有効にしない", () => {
    expect(passwordAuthEnabled({ PASSWORD_LOGIN: "true" })).toBe(false);
  });

  it.each(["1", "TRUE", "yes", ""])("%j は true として扱わない", (value) => {
    expect(passwordAuthEnabled({ PASSWORD_SIGNUP: value })).toBe(false);
  });
});
