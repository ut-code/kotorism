import { describe, expect, it } from "vitest";

import { passwordAuthFlags } from "./password-auth";

describe("passwordAuthFlags", () => {
  it("未設定ならパスワードでのログインも登録も無効", () => {
    expect(passwordAuthFlags({})).toEqual({ login: false, signUp: false });
  });

  it("PASSWORD_LOGIN=true ならログインだけ有効", () => {
    expect(passwordAuthFlags({ PASSWORD_LOGIN: "true" })).toEqual({ login: true, signUp: false });
  });

  it("PASSWORD_SIGNUP=true なら登録もログインも有効", () => {
    expect(passwordAuthFlags({ PASSWORD_SIGNUP: "true" })).toEqual({ login: true, signUp: true });
  });

  it.each(["1", "TRUE", "yes", ""])("%j は true として扱わない", (value) => {
    expect(passwordAuthFlags({ PASSWORD_LOGIN: value, PASSWORD_SIGNUP: value })).toEqual({
      login: false,
      signUp: false,
    });
  });
});
