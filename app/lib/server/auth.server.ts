import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { prisma } from "@/lib/server/prisma.server";
import { passwordAuthFlags } from "@/lib/shared/password-auth";
import {
  googleProfileToUser,
  withoutClientInfo,
  withoutOAuthTokens,
} from "@/lib/shared/personal-data";

export const passwordAuth = passwordAuthFlags(process.env);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: passwordAuth.login,
    disableSignUp: !passwordAuth.signUp,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      mapProfileToUser: googleProfileToUser,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // 既存ユーザーのメールは <username>@vocabook.local という架空のアドレスなので、
      // 一致を求めると Google を連携できない。ログイン中の本人が明示的に連携するときだけ効く設定なので乗っ取りにはならない
      allowDifferentEmails: true,
    },
  },
  // 使わない個人情報(トークン、IP アドレス、User-Agent)は保存しない。理由は lib/shared/personal-data.ts
  databaseHooks: {
    account: {
      create: { before: async (account) => ({ data: withoutOAuthTokens(account) }) },
      update: { before: async (account) => ({ data: withoutOAuthTokens(account) }) },
    },
    session: {
      create: { before: async (session) => ({ data: withoutClientInfo(session) }) },
      update: { before: async (session) => ({ data: withoutClientInfo(session) }) },
    },
  },
  advanced: { ipAddress: { disableIpTracking: true } },
  // 移行期間中のユーザー名ログイン(signIn.username)に必要。Google だけになったら外せる
  plugins: [username()],
});
