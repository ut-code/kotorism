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

describe("表の下の＋から単語を追加する", () => {
  it("表の中で単語を続けて追加でき、Esc で入力行を閉じる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    const head = table.getByRole("textbox", { name: "見出し語" });
    expect(head).toHaveFocus();
    await user.type(head, "merci");
    await user.type(table.getByRole("textbox", { name: "意味" }), "ありがとう{Enter}");

    // 追加した単語が表の行として並び、入力行は空に戻って見出し語の欄から続けて入力できる
    await waitFor(() => expect(head).toHaveValue(""));
    expect(await table.findByRole("cell", { name: "merci" })).toBeInTheDocument();
    expect(head).toHaveFocus();

    await user.type(head, "bonjour{Enter}");
    expect(await table.findByRole("cell", { name: "bonjour" })).toBeInTheDocument();
    expect((await savedCards(notebookId)).map((c) => c.head)).toEqual(["merci", "bonjour"]);

    await user.keyboard("{Escape}");
    expect(table.queryByRole("textbox", { name: "見出し語" })).not.toBeInTheDocument();
    expect(table.getByRole("button", { name: "表に単語を追加" })).toBeInTheDocument();
  });

  it("見出し行の＋から列を追加でき、追加した列にも入力できる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(table.getByRole("button", { name: "表に列を追加" }));
    const name = table.getByRole("textbox", { name: "新しい列の名前" });
    expect(name).toHaveFocus();
    await user.type(name, "例文{Enter}");

    expect(await table.findByRole("columnheader", { name: "例文" })).toBeInTheDocument();
    expect(table.queryByRole("textbox", { name: "新しい列の名前" })).not.toBeInTheDocument();
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    expect(table.getByRole("textbox", { name: "例文" })).toBeInTheDocument();
  });

  it("矢印キーで隣の入力欄へ移れる（文字の途中ではカーソルが動くだけ）", async () => {
    await seedNotebook(notebookId, { columns: ["見出し語", "意味", "例文"], cards: [] });
    const { user, table } = await renderNotebook(notebookId);
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    const head = table.getByRole("textbox", { name: "見出し語" });
    const meaning = table.getByRole("textbox", { name: "意味" });
    const example = table.getByRole("textbox", { name: "例文" });

    await user.type(head, "merci");
    // 文字の最後で → を押すと、右の欄へ移る。いちばん右の欄ではそれ以上移らない
    await user.keyboard("{ArrowRight}");
    expect(meaning).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(example).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(example).toHaveFocus();

    // 空の欄（カーソルが先頭）で ← を押すと、左の欄へ移る
    await user.keyboard("{ArrowLeft}");
    expect(meaning).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(head).toHaveFocus();

    // 文字の途中では、欄の中でカーソルが動くだけで移らない
    await user.keyboard("{End}{ArrowLeft}{ArrowRight}");
    expect(head).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(head).toHaveFocus();
  });

  it("単語が1件も無いとき、＋で最初の単語を入力している間は「まだ単語がありません」を出さない", async () => {
    const { user, table } = await renderNotebook(notebookId);
    expect(table.getByText(/まだ単語がありません/)).toBeInTheDocument();
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    expect(table.queryByText(/まだ単語がありません/)).not.toBeInTheDocument();
    // 入力をやめて閉じると、また表示する
    await user.keyboard("{Escape}");
    expect(table.getByText(/まだ単語がありません/)).toBeInTheDocument();
  });

  it("入力中も＋が見え、↓ で単語を加えて次の空の行へ進み、「キャンセル」で閉じる", async () => {
    const { user, table, tableElement } = await renderNotebook(notebookId);
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    const head = table.getByRole("textbox", { name: "見出し語" });

    // 入力中も＋は見えている。「閉じる」ではなく「キャンセル」
    expect(table.getByRole("button", { name: "表に単語を追加" })).toBeInTheDocument();
    expect(table.queryByRole("button", { name: "閉じる" })).not.toBeInTheDocument();
    expect(table.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();

    // ↓ で入力した単語を加え、次の空の行へ進む
    await user.type(head, "merci");
    await user.type(table.getByRole("textbox", { name: "意味" }), "ありがとう{ArrowDown}");
    expect(await table.findByRole("cell", { name: "merci" })).toBeInTheDocument();
    await waitFor(() => expect(head).toHaveValue(""));
    expect(head).toHaveFocus();

    // 何も入力していなければ、↓ を押しても単語は増えない
    await user.keyboard("{ArrowDown}");
    expect(tableElement.querySelectorAll("tbody tr[data-card-index]")).toHaveLength(1);

    // 入力中に＋を押すと、入力した単語を加えて次の空の行へ
    await user.type(head, "bonjour");
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    expect(await table.findByRole("cell", { name: "bonjour" })).toBeInTheDocument();
    await waitFor(() => expect(head).toHaveValue(""));

    await user.click(table.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("textbox", { name: "見出し語" })).not.toBeInTheDocument();
  });
});
