import { screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { requireUser } from "@/lib/server/session.server";
import { applyMigrations, createNotebook, createUser } from "@/lib/server/test/db";

import { renderNotebook, seedNotebook } from "./render-notebook";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));
// 最近見た単語帳の記録はこのテストの対象外
vi.mock("@/lib/server/recent-activity.server", () => ({
  recordNotebookView: vi.fn(async () => {}),
}));

let notebookId: string;

beforeAll(applyMigrations);
beforeEach(async () => {
  const user = await createUser();
  vi.mocked(requireUser).mockResolvedValue(user as never);
  notebookId = (await createNotebook(user.id)).id;
});

describe("列の名前の変更", () => {
  beforeEach(() =>
    seedNotebook(notebookId, {
      columns: ["見出し語", "意味", "例文"],
      cards: [
        ["un", { 意味: "1", 例文: "un chat" }],
        ["deux", { 意味: "2", 例文: "deux chats" }],
      ],
    }),
  );

  it("「列を編集」ボタンは無く、列の見出しをダブルクリックすると名前を変えられる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    expect(screen.queryByRole("button", { name: "列を編集" })).not.toBeInTheDocument();

    await user.dblClick(table.getByRole("columnheader", { name: "意味" }));
    const input = table.getByRole("textbox", { name: "列の名前" });
    expect(input).toHaveFocus();
    expect(input).toHaveValue("意味");
    await user.clear(input);
    await user.type(input, "日本語訳{Enter}");

    expect(await table.findByRole("columnheader", { name: "日本語訳" })).toBeInTheDocument();
    // 列の値はそのまま残る
    expect(table.getByRole("cell", { name: "un chat" })).toBeInTheDocument();
    expect(table.getByRole("cell", { name: "2" })).toBeInTheDocument();
  });

  it("名前の変更中に Esc を押すと、変えずに戻る", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.dblClick(table.getByRole("columnheader", { name: "意味" }));
    await user.type(table.getByRole("textbox", { name: "列の名前" }), "取り消す名前{Escape}");
    expect(table.getByRole("columnheader", { name: "意味" })).toBeInTheDocument();
  });

  it("名前の変更中に「列を削除」で、その列を消せる（見出し語の列は消せない）", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.dblClick(table.getByRole("columnheader", { name: "見出し語" }));
    expect(table.queryByRole("button", { name: "列を削除" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.dblClick(table.getByRole("columnheader", { name: "例文" }));
    await user.click(table.getByRole("button", { name: "列を削除" }));
    await waitFor(() =>
      expect(table.queryByRole("columnheader", { name: "例文" })).not.toBeInTheDocument(),
    );
    expect(table.queryByRole("cell", { name: "un chat" })).not.toBeInTheDocument();
  });
});
