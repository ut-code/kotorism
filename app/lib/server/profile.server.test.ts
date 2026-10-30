import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { updateDisplayName } from "@/lib/server/profile.server";
import { applyMigrations, createUser } from "@/lib/server/test/db";

beforeAll(async () => {
  await applyMigrations();
});

describe("updateDisplayName", () => {
  it("前後の空白を除いて、本人の名前だけを書き換える", async () => {
    const me = await createUser();
    const other = await createUser();

    expect(await updateDisplayName(me.id, "  たなか ")).toEqual({ success: true, data: "たなか" });

    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.id } })).name).toBe("たなか");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).name).toBe(
      other.name,
    );
  });

  it("空の名前は保存せず、エラーを返す", async () => {
    const me = await createUser();

    expect(await updateDisplayName(me.id, " ")).toEqual({
      success: false,
      error: "名前を入力してください。",
    });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.id } })).name).toBe(me.name);
  });
});
