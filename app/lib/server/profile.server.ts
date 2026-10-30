import { prisma } from "@/lib/server/prisma.server";
import { parseDisplayName } from "@/lib/shared/display-name-schema";

export async function updateDisplayName(userId: string, input: unknown) {
  const parsed = parseDisplayName(input);
  if (parsed.success) {
    await prisma.user.update({ where: { id: userId }, data: { name: parsed.data } });
  }
  return parsed;
}
