import { cleanup, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { applyMigrations, createUser } from "@/lib/server/test/db";

import { renderNotebook } from "./render-notebook";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));
// 最近見た単語帳の記録はこのテストの対象外
vi.mock("@/lib/server/recent-activity.server", () => ({
  recordNotebookView: vi.fn(async () => {}),
}));

let userId: string;

beforeAll(applyMigrations);
beforeEach(async () => {
  const user = await createUser();
  userId = user.id;
  vi.mocked(requireUser).mockResolvedValue(user as never);
});

const newNotebook = async (title = "無題の単語帳") =>
  (await prisma.notebook.create({ data: { title, columns: ["見出し語", "意味"], userId } })).id;
const titles = async () =>
  (await prisma.notebook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })).map(
    (n) => n.title,
  );

describe("単語帳のタイトル", () => {
  it("新しい単語帳は、仮のタイトルを選んだ入力欄から始まり、再読み込みでは入力欄にならない", async () => {
    const id = await newNotebook();
    const { user } = await renderNotebook(id, "?new=1");
    const titleInput = await screen.findByRole("textbox", { name: "単語帳のタイトル" });
    await waitFor(() => expect(titleInput).toHaveFocus());
    expect(titleInput).toHaveValue("無題の単語帳");
    await user.keyboard("テストの単語帳{Enter}");
    expect(
      await screen.findByRole("heading", { level: 1, name: "テストの単語帳" }),
    ).toBeInTheDocument();
    // 同じページで、表への追加と Excel の取り込みがすぐ使える
    expect(screen.getAllByRole("button", { name: "表に単語を追加" }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Excel・スプレッドシートから追加" }),
    ).toBeInTheDocument();

    cleanup();
    await renderNotebook(id);
    expect(screen.queryByRole("textbox", { name: "単語帳のタイトル" })).not.toBeInTheDocument();
  });

  it("あとからタイトルを押して変えられる（Esc で取り消し）", async () => {
    const id = await newNotebook("元のタイトル");
    const { user } = await renderNotebook(id);
    await user.click(screen.getByRole("button", { name: "元のタイトル" }));
    const titleInput = screen.getByRole("textbox", { name: "単語帳のタイトル" });
    await user.clear(titleInput);
    await user.type(titleInput, "取り消すタイトル{Escape}");
    expect(screen.getByRole("heading", { level: 1, name: "元のタイトル" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "元のタイトル" }));
    await user.clear(screen.getByRole("textbox", { name: "単語帳のタイトル" }));
    await user.type(
      screen.getByRole("textbox", { name: "単語帳のタイトル" }),
      "変えたタイトル{Enter}",
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "変えたタイトル" }),
    ).toBeInTheDocument();
    expect(await titles()).toEqual(["変えたタイトル"]);
  });
});

describe("単語帳の名前が自分の別の単語帳と重なったとき", () => {
  async function tryDuplicate(name: string) {
    await newNotebook(name);
    const id = await newNotebook();
    const { user } = await renderNotebook(id, "?new=1");
    const titleInput = await screen.findByRole("textbox", { name: "単語帳のタイトル" });
    await user.clear(titleInput);
    await user.type(titleInput, `${name}{Enter}`);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      `「${name}」という名前の単語帳がすでにあります`,
    );
    return user;
  }

  it("番号を付けた名前を選べる", async () => {
    const user = await tryDuplicate("重なり確認");
    await user.click(screen.getByRole("button", { name: "「重なり確認 1」にする" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "重なり確認 1" }),
    ).toBeInTheDocument();
  });

  it("今日の日付を付けた名前を選べる", async () => {
    const user = await tryDuplicate("重なり確認");
    await user.click(
      screen.getByRole("button", { name: /^「重なり確認 \d{4}-\d{2}-\d{2}」にする$/ }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: /^重なり確認 \d{4}-\d{2}-\d{2}$/ }),
    ).toBeInTheDocument();
  });

  it("このままの名前にもできる", async () => {
    const user = await tryDuplicate("重なり確認");
    await user.click(screen.getByRole("button", { name: "このままにする" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "重なり確認" }),
    ).toBeInTheDocument();
    expect(await titles()).toEqual(["重なり確認", "重なり確認"]);
  });

  it("新しい単語帳を「無題の単語帳」のまま決めても、重なっていれば知らせる", async () => {
    await newNotebook();
    const id = await newNotebook();
    const { user } = await renderNotebook(id, "?new=1");
    await screen.findByRole("textbox", { name: "単語帳のタイトル" });
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "「無題の単語帳」という名前の単語帳がすでにあります",
    );
  });
});

it("Excel・スプレッドシートから追加では、Googleスプレッドシートを .xlsx で書き出して取り込む方法を案内する", async () => {
  const { user } = await renderNotebook(await newNotebook());
  await user.click(screen.getByRole("button", { name: "Excel・スプレッドシートから追加" }));
  expect(
    screen.getByText(
      "Googleスプレッドシートの場合は、「ファイル」→「ダウンロード」→「Microsoft Excel（.xlsx）」で保存したファイルを選んでください。",
    ),
  ).toBeInTheDocument();
});
