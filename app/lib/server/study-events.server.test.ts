import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { applyMigrations, createNotebook, createUser } from "@/lib/server/test/db";
import { toStudyDay } from "@/lib/shared/study-calendar";

import { deleteNotebook } from "./my-notebooks/actions.server";
import { getDeckOptions, getPeriodDetail, recordStudyEvent } from "./study-events.server";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));
// 教材のセクション一覧（MDX）はこのテストの対象外なので読み込まない
vi.mock("@/lib/shared/learn/content", () => ({ getSections: vi.fn(async () => []) }));

beforeAll(async () => {
  await applyMigrations();
});

const noFilters = { language: "", deck: "", type: "" };

describe("削除した単語帳の学習記録", () => {
  it("単語帳を削除しても学習記録は残り、学習カレンダーには元の名前に（削除済み）を付けて出す", async () => {
    const user = await createUser();
    const notebook = await prisma.notebook.update({
      where: { id: (await createNotebook(user.id)).id },
      data: { title: "フランス語の基本単語" },
    });
    // 学習の記録と、日ごとの集計を一緒に書く（アプリと同じ書き方）
    await recordStudyEvent(user.id, {
      eventType: "card_study",
      itemId: "card-1",
      deckId: notebook.id,
    });

    vi.mocked(requireUser).mockResolvedValue(user as never);
    await deleteNotebook(notebook.id).catch((error) => {
      // 削除後は一覧へ redirect する（Response が throw される）
      if (!(error instanceof Response)) throw error;
    });

    expect(await prisma.notebook.count({ where: { id: notebook.id } })).toBe(0);
    const today = toStudyDay(new Date());
    const detail = await getPeriodDetail(user.id, today, today, noFilters);
    expect(detail.materials).toHaveLength(1);
    expect(detail.materials[0].label).toBe("フランス語の基本単語（削除済み）");
    expect(detail.materials[0].href).toBeNull();

    // 学習カレンダーの単語帳の絞り込みにも、記録のある削除済みの単語帳を出す
    expect(await getDeckOptions(user.id)).toContainEqual({
      id: notebook.id,
      title: "フランス語の基本単語（削除済み）",
    });
  });

  it("記録の無い削除済みの単語帳は、絞り込みに出さない", async () => {
    const user = await createUser();
    const notebook = await createNotebook(user.id);
    vi.mocked(requireUser).mockResolvedValue(user as never);
    await deleteNotebook(notebook.id).catch((error) => {
      if (!(error instanceof Response)) throw error;
    });
    expect(await getDeckOptions(user.id)).toEqual([]);
  });
});
