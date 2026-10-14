import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

// 開発モードではファイル変更のたびにモジュールが再評価され、
// その都度 PrismaClient を new すると接続数が増え続けてしまう。
// globalThis にインスタンスを退避し、HMR をまたいで使い回す。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ローカル開発時は file:./prisma/dev.db、本番(Turso)時は
// libsql://<db>.turso.io?authToken=... 形式の DATABASE_URL を使う。
// authToken はURLのクエリパラメータとして埋め込まれ、libsqlクライアントが解釈する。
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
