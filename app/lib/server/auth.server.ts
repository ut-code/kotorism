import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { prisma } from "@/lib/server/prisma.server";
import { passwordAuthEnabled } from "@/lib/shared/password-auth";
import {
  googleProfileToUser,
  withoutClientInfo,
  withoutOAuthTokens,
} from "@/lib/shared/personal-data";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: { enabled: passwordAuthEnabled(process.env) },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      mapProfileToUser: googleProfileToUser,
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
});
