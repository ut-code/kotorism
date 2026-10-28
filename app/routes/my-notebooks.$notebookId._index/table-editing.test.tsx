import { screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { requireUser } from "@/lib/server/session.server";
import { applyMigrations, createNotebook, createUser } from "@/lib/server/test/db";

import { renderNotebook, savedCards, seedNotebook } from "./render-notebook";

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

const savedHeads = async () => (await savedCards(notebookId)).map((card) => card.head);

describe("まとめて編集", () => {
  beforeEach(() =>
    seedNotebook(notebookId, {
      cards: [
        ["merci", { 意味: "ありがとう" }],
        ["bonjour", { 意味: "こんにちは" }],
      ],
    }),
  );

  it("「編集」を押すと表のすべての入力欄が編集でき、まとめて保存できる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    // 行ごとの「編集」は無く、表の上の「編集」を1回押すだけ
    expect(table.queryByRole("button", { name: "編集" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "表を編集" }));

    const heads = table.getAllByRole("textbox", { name: "見出し語" });
    const meanings = table.getAllByRole("textbox", { name: "意味" });
    expect(heads).toHaveLength(2);
    expect(meanings).toHaveLength(2);
    expect(heads[0]).toHaveValue("merci");
    expect(meanings[1]).toHaveValue("こんにちは");

    await user.clear(heads[0]);
    await user.type(heads[0], "merci beaucoup");
    await user.clear(meanings[1]);
    await user.type(meanings[1], "やあ");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(table.queryAllByRole("textbox")).toHaveLength(0));
    expect(table.getByRole("cell", { name: "merci beaucoup" })).toBeInTheDocument();
    expect(table.getByRole("cell", { name: "やあ" })).toBeInTheDocument();
    expect(await savedHeads()).toEqual(["merci beaucoup", "bonjour"]);
  });

  it("キャンセルすると変更を捨てる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(screen.getByRole("button", { name: "表を編集" }));
    await user.type(table.getAllByRole("textbox", { name: "意味" })[0], "変えたけれど取り消す");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(table.queryAllByRole("textbox")).toHaveLength(0);
    expect(table.getByRole("cell", { name: "ありがとう" })).toBeInTheDocument();
  });

  it("見出し語を空にすると、何も保存せずに理由を表示する", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(screen.getByRole("button", { name: "表を編集" }));
    await user.type(table.getAllByRole("textbox", { name: "意味" })[0], "保存されないはず");
    await user.clear(table.getAllByRole("textbox", { name: "見出し語" })[1]);
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    // 編集中のまま。どちらの単語も保存されていない
    expect(table.getAllByRole("textbox", { name: "見出し語" })).toHaveLength(2);
    expect(await savedHeads()).toEqual(["merci", "bonjour"]);
  });

  it("編集中も表の下の＋で行を足せ、保存すると新しい単語として加わる（空の行は無視する）", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(screen.getByRole("button", { name: "表を編集" }));

    await user.click(table.getByRole("button", { name: "表に行を追加" }));
    const heads = () => table.getAllByRole("textbox", { name: "見出し語" });
    expect(heads()).toHaveLength(3);
    expect(heads()[2]).toHaveFocus();
    await user.type(heads()[2], "au revoir");
    await user.type(table.getAllByRole("textbox", { name: "意味" })[2], "さようなら");
    // 何も入力しない行をもう1つ足しておく
    await user.click(table.getByRole("button", { name: "表に行を追加" }));
    expect(heads()).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(table.queryAllByRole("textbox")).toHaveLength(0));
    expect(table.getByRole("cell", { name: "さようなら" })).toBeInTheDocument();
    // 空の行は単語にならない
    expect(await savedHeads()).toEqual(["merci", "bonjour", "au revoir"]);
  });

  it("編集中は ↑↓ で上下の行へ移り、いちばん下の行で ↓ を押すと新しい行が増える", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(screen.getByRole("button", { name: "表を編集" }));
    const heads = () => table.getAllByRole("textbox", { name: "見出し語" });
    const meanings = () => table.getAllByRole("textbox", { name: "意味" });

    meanings()[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(meanings()[1]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(meanings()[0]).toHaveFocus();

    // いちばん下の行で ↓ を押すと、新しい行が増えて、同じ列の欄へ移る
    meanings()[1].focus();
    await user.keyboard("{ArrowDown}");
    expect(meanings()).toHaveLength(3);
    expect(meanings()[2]).toHaveFocus();
    expect(heads()).toHaveLength(3);

    // 文字の最後で → を押すと、右隣の欄へ移る
    await user.click(heads()[0]);
    await user.keyboard("{End}{ArrowRight}");
    expect(meanings()[0]).toHaveFocus();
  });
});
