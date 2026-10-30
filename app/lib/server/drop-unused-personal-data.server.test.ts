import { beforeAll, expect, it } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { applyMigrations, runMigration } from "@/lib/server/test/db";

beforeAll(async () => {
  await applyMigrations();
});

// 本番に保存済みのトークン・IP アドレス・本物のメールと画像を、デプロイ時に消すマイグレーション
it("保存済みの使わない個人情報を消し、ログインに要る Google のユーザー ID とパスワードは残す", async () => {
  const google = { providerId: "google", issuer: "https://accounts.google.com" };
  const tokens = { accessToken: "ya29.xxx", idToken: "eyJ.xxx", accessTokenExpiresAt: new Date() };
  // Google で新規登録したユーザー
  await prisma.user.create({
    data: {
      id: "g",
      name: "Google 太郎",
      email: "taro@gmail.com",
      image: "https://lh3.googleusercontent.com/a/xxx",
      accounts: { create: { id: "ga", accountId: "111", ...google, ...tokens } },
      sessions: {
        create: {
          id: "gs",
          token: "t1",
          expiresAt: new Date(),
          ipAddress: "203.0.113.1",
          userAgent: "Mozilla/5.0",
        },
      },
    },
  });
  // ユーザー名で登録し、あとから Google を連携したユーザー
  await prisma.user.create({
    data: {
      id: "p",
      name: "たなか",
      email: "tanaka@vocabook.local",
      username: "tanaka",
      accounts: {
        create: [
          {
            id: "pc",
            accountId: "p",
            providerId: "credential",
            issuer: "local:credential",
            password: "hashed",
          },
          { id: "pg", accountId: "222", ...google, ...tokens },
        ],
      },
    },
  });

  await runMigration("20261030000000_drop_unused_personal_data");

  expect(await prisma.user.findUniqueOrThrow({ where: { id: "g" } })).toMatchObject({
    name: "Google 太郎",
    email: "111@google.vocabook.local",
    image: null,
  });
  expect(await prisma.user.findUniqueOrThrow({ where: { id: "p" } })).toMatchObject({
    email: "tanaka@vocabook.local",
    username: "tanaka",
  });
  for (const id of ["ga", "pg"]) {
    expect(await prisma.account.findUniqueOrThrow({ where: { id } })).toMatchObject({
      accessToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
    });
  }
  expect(await prisma.account.findUniqueOrThrow({ where: { id: "ga" } })).toMatchObject({
    accountId: "111",
  });
  expect(await prisma.account.findUniqueOrThrow({ where: { id: "pc" } })).toMatchObject({
    password: "hashed",
  });
  expect(await prisma.session.findUniqueOrThrow({ where: { id: "gs" } })).toMatchObject({
    ipAddress: null,
    userAgent: null,
  });
});
