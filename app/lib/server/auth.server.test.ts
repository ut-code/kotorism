import { beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { applyMigrations, createUser } from "@/lib/server/test/db";

// パスワード登録でセッションを作るため、auth.server を読み込む前に有効にしておく
vi.stubEnv("PASSWORD_SIGNUP", "true");
const { auth } = await import("@/lib/server/auth.server");

beforeAll(async () => {
  await applyMigrations();
});

describe("使わない個人情報を DB に保存しない", () => {
  it("セッションに IP アドレスと User-Agent を保存しない", async () => {
    const { user } = await auth.api.signUpEmail({
      body: { name: "taro", email: "taro@vocabook.local", password: "password-1234" },
      headers: new Headers({ "x-forwarded-for": "203.0.113.1", "user-agent": "Mozilla/5.0" }),
    });

    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ ipAddress: null, userAgent: null });
  });

  it("OAuth のトークンは作成時も更新時も保存しない", async () => {
    const user = await createUser();
    const ctx = await auth.$context;
    const tokens = {
      accessToken: "ya29.xxx",
      refreshToken: "1//xxx",
      idToken: "eyJ.xxx",
      accessTokenExpiresAt: new Date(),
    };
    const account = await ctx.internalAdapter.createAccount({
      userId: user.id,
      providerId: "google",
      accountId: "1234567890",
      issuer: "https://accounts.google.com",
      ...tokens,
    });
    await ctx.internalAdapter.updateAccount(account.id, tokens);

    expect(await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).toMatchObject({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
    });
  });
});
