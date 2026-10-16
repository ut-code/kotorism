import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/server/prisma.server";

// prisma/migrations/*/migration.sql を古い順に、テスト用のインメモリ DB へ当てる
export async function applyMigrations() {
  const dir = path.join(process.cwd(), "prisma/migrations");
  for (const name of readdirSync(dir).sort()) {
    const file = path.join(dir, name, "migration.sql");
    let sql: string;
    try {
      sql = readFileSync(file, "utf8");
    } catch {
      continue; // migration_lock.toml など
    }
    for (const statement of sql.split(/;\s*\n/)) {
      if (statement.trim()) await prisma.$executeRawUnsafe(statement);
    }
  }
}

let sequence = 0;
const nextId = (prefix: string) => `${prefix}_${(sequence += 1)}`;

export function createUser() {
  const id = nextId("user");
  return prisma.user.create({
    data: { id, name: id, email: `${id}@example.test`, username: id },
  });
}

export function createNotebook(ownerId: string, overrides: { isPublic?: boolean } = {}) {
  return prisma.notebook.create({
    data: {
      title: "テスト用の単語帳",
      columns: ["見出し語", "意味"],
      userId: ownerId,
      ...overrides,
    },
  });
}

export function createCard(notebookId: string, head: string, position = 0) {
  return prisma.card.create({
    data: { notebookId, position, data: { head, rows: [{ 意味: `${head}の意味` }] } },
  });
}

export function addEditor(notebookId: string, userId: string) {
  return prisma.notebookShare.create({ data: { notebookId, userId } });
}

// action が throw する redirect(Response)から、遷移先を取り出す
export async function redirectLocation(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      return error.headers.get("Location");
    }
    throw error;
  }
  return null;
}
