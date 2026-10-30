import { describe, expect, it } from "vitest";

import { googleProfileToUser, withoutClientInfo, withoutOAuthTokens } from "./personal-data";

describe("googleProfileToUser", () => {
  it("メールは Google のユーザー ID から作る架空のアドレスにし、本物のメールと画像は保存しない", () => {
    const profile = {
      sub: "1234567890",
      email: "someone@gmail.com",
      picture: "https://lh3.googleusercontent.com/a/xxx",
    };
    expect(googleProfileToUser(profile)).toEqual({
      email: "1234567890@google.vocabook.local",
      image: undefined,
    });
  });
});

describe("withoutOAuthTokens", () => {
  it("トークンと有効期限をすべて null にし、それ以外は残す", () => {
    expect(
      withoutOAuthTokens({
        providerId: "google",
        accountId: "1234567890",
        accessToken: "ya29.xxx",
        refreshToken: "1//xxx",
        idToken: "eyJ.xxx",
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      }),
    ).toEqual({
      providerId: "google",
      accountId: "1234567890",
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
  });
});

describe("withoutClientInfo", () => {
  it("IP アドレスと User-Agent を null にし、それ以外は残す", () => {
    expect(
      withoutClientInfo({ userId: "u1", ipAddress: "203.0.113.1", userAgent: "Mozilla/5.0" }),
    ).toEqual({ userId: "u1", ipAddress: null, userAgent: null });
  });
});
