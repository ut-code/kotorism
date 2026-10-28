import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { prisma } from "@/lib/server/prisma.server";
import { passwordAuthFlags } from "@/lib/shared/password-auth";

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
  // 移行期間中のユーザー名ログイン(signIn.username)に必要。Google だけになったら外せる
  plugins: [username()],
});
