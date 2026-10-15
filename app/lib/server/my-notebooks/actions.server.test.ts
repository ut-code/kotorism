import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import {
  addEditor,
  applyMigrations,
  createCard,
  createNotebook,
  createUser,
  redirectLocation,
} from "@/lib/server/test/db";

import {
  CARD_HEAD_MAX_LENGTH,
  CARD_VALUE_MAX_LENGTH,
  COLUMN_NAME_MAX_LENGTH,
  MAX_STAR_COUNT,
  NOTEBOOK_TITLE_MAX_LENGTH,
} from "@/lib/shared/notebook-schema";

import {
  addNotebookColumn,
  createBlankNotebook,
  createCard as createCardAction,
  deleteCard,
  deleteNotebook,
  setStarCount,
  toggleNotebookPublic,
  toggleStar,
  updateCard,
} from "./actions.server";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));

const loginAs = (user: { id: string }) => vi.mocked(requireUser).mockResolvedValue(user as never);

function form(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

let owner: { id: string };
let editor: { id: string };
let stranger: { id: string };
let notebook: { id: string };

beforeAll(async () => {
  await applyMigrations();
});

beforeEach(async () => {
  [owner, editor, stranger] = await Promise.all([createUser(), createUser(), createUser()]);
  notebook = await createNotebook(owner.id);
  await addEditor(notebook.id, editor.id);
});

describe("createBlankNotebook", () => {
  it("「見出し語」「意味」の 2 列で作成し、その単語帳へ遷移する", async () => {
    loginAs(owner);
    const location = await redirectLocation(() =>
      createBlankNotebook(form({ title: " 新しい帳 " })),
    );

    const created = await prisma.notebook.findFirstOrThrow({
      where: { userId: owner.id, title: "新しい帳" },
    });
    expect(created.columns).toEqual(["見出し語", "意味"]);
    expect(location).toBe(`/my-notebooks/${created.id}`);
  });

  it("タイトルが空(空白のみ)ならエラーを返し、作成しない", async () => {
    loginAs(owner);
    const before = await prisma.notebook.count({ where: { userId: owner.id } });
    const state = await createBlankNotebook(form({ title: "   " }));
    expect(state.error).toBeTruthy();
    expect(await prisma.notebook.count({ where: { userId: owner.id } })).toBe(before);
  });
});

describe("deleteNotebook", () => {
  it("作成者は削除でき、カードも一緒に消える", async () => {
    const card = await createCard(notebook.id, "chat");
    loginAs(owner);
    expect(await redirectLocation(() => deleteNotebook(notebook.id))).toBe("/my-notebooks");
    expect(await prisma.notebook.count({ where: { id: notebook.id } })).toBe(0);
    expect(await prisma.card.count({ where: { id: card.id } })).toBe(0);
  });

  it("共同編集者・無関係なユーザーは削除できない", async () => {
    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(deleteNotebook(notebook.id)).rejects.toThrow();
    }
    expect(await prisma.notebook.count({ where: { id: notebook.id } })).toBe(1);
  });
});

describe("toggleNotebookPublic", () => {
  it("作成者だけが公開・非公開を切り替えられる", async () => {
    loginAs(owner);
    await toggleNotebookPublic(notebook.id);
    expect((await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } })).isPublic).toBe(
      true,
    );
    await toggleNotebookPublic(notebook.id);
    expect((await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } })).isPublic).toBe(
      false,
    );

    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(toggleNotebookPublic(notebook.id)).rejects.toThrow();
    }
  });
});

describe("createCard", () => {
  it("作成者と共同編集者は単語を末尾に追加できる", async () => {
    loginAs(owner);
    expect(await createCardAction(notebook.id, form({ head: "chat", "row:0:意味": "猫" }))).toEqual(
      { added: "chat" },
    );
    loginAs(editor);
    await createCardAction(notebook.id, form({ head: "chien", "row:0:意味": "犬" }));

    const cards = await prisma.card.findMany({
      where: { notebookId: notebook.id },
      orderBy: { position: "asc" },
    });
    expect(cards.map((c) => c.position)).toEqual([0, 1]);
    expect(cards[0].data).toEqual({ head: "chat", rows: [{ 意味: "猫" }] });
  });

  it("見出し語が空ならエラーを返し、追加しない", async () => {
    loginAs(owner);
    const state = await createCardAction(notebook.id, form({ head: " ", "row:0:意味": "猫" }));
    expect(state.error).toBeTruthy();
    expect(await prisma.card.count({ where: { notebookId: notebook.id } })).toBe(0);
  });

  it("無関係なユーザーは追加できない", async () => {
    loginAs(stranger);
    await expect(createCardAction(notebook.id, form({ head: "chat" }))).rejects.toThrow();
    expect(await prisma.card.count({ where: { notebookId: notebook.id } })).toBe(0);
  });
});

describe("updateCard / deleteCard", () => {
  it("共同編集者は単語を編集・削除できる", async () => {
    const card = await createCard(notebook.id, "chat");
    loginAs(editor);
    await updateCard(card.id, notebook.id, form({ head: "chats", "row:0:意味": "猫たち" }));
    expect((await prisma.card.findUniqueOrThrow({ where: { id: card.id } })).data).toEqual({
      head: "chats",
      rows: [{ 意味: "猫たち" }],
    });

    await deleteCard(card.id, notebook.id);
    expect(await prisma.card.count({ where: { id: card.id } })).toBe(0);
  });

  it("無関係なユーザーは編集・削除できない", async () => {
    const card = await createCard(notebook.id, "chat");
    loginAs(stranger);
    await expect(updateCard(card.id, notebook.id, form({ head: "x" }))).rejects.toThrow();
    await expect(deleteCard(card.id, notebook.id)).rejects.toThrow();
    expect(await prisma.card.count({ where: { id: card.id } })).toBe(1);
  });

  it("自分の単語帳の ID を使って、他人の単語帳のカードを削除・編集することはできない", async () => {
    const other = await createUser();
    const othersNotebook = await createNotebook(other.id);
    const othersCard = await createCard(othersNotebook.id, "secret");

    loginAs(owner);
    await expect(deleteCard(othersCard.id, notebook.id)).rejects.toThrow();
    await expect(
      updateCard(othersCard.id, notebook.id, form({ head: "hacked" })),
    ).rejects.toThrow();
    expect((await prisma.card.findUniqueOrThrow({ where: { id: othersCard.id } })).data).toEqual({
      head: "secret",
      rows: [{ 意味: "secretの意味" }],
    });
  });
});

describe("★(toggleStar / setStarCount)", () => {
  it("★はユーザーごとに独立していて、付けるたびに回数が増える", async () => {
    const card = await createCard(notebook.id, "chat");

    loginAs(owner);
    await toggleStar(card.id, notebook.id);
    loginAs(editor);
    await toggleStar(card.id, notebook.id);
    await toggleStar(card.id, notebook.id); // 外す(回数は減らさない)
    await toggleStar(card.id, notebook.id); // もう一度付ける

    const progress = async (userId: string) =>
      prisma.cardProgress.findUniqueOrThrow({
        where: { cardId_userId: { cardId: card.id, userId } },
      });
    expect(await progress(owner.id)).toMatchObject({ starred: true, starCount: 1 });
    expect(await progress(editor.id)).toMatchObject({ starred: true, starCount: 2 });
  });

  it("回数を 0 にすると★も外れ、負数や不正な値は 0 になる", async () => {
    const card = await createCard(notebook.id, "chat");
    loginAs(owner);
    await toggleStar(card.id, notebook.id);
    await setStarCount(card.id, notebook.id, form({ count: "0" }));
    expect(
      await prisma.cardProgress.findUniqueOrThrow({
        where: { cardId_userId: { cardId: card.id, userId: owner.id } },
      }),
    ).toMatchObject({ starred: false, starCount: 0 });

    await setStarCount(card.id, notebook.id, form({ count: "-5" }));
    await setStarCount(card.id, notebook.id, form({ count: "abc" }));
    expect(
      (
        await prisma.cardProgress.findUniqueOrThrow({
          where: { cardId_userId: { cardId: card.id, userId: owner.id } },
        })
      ).starCount,
    ).toBe(0);
  });

  it("他人の単語帳のカードには★を付けられない", async () => {
    const other = await createUser();
    const othersCard = await createCard((await createNotebook(other.id)).id, "secret");
    loginAs(owner);
    await expect(toggleStar(othersCard.id, notebook.id)).rejects.toThrow();
    expect(await prisma.cardProgress.count({ where: { cardId: othersCard.id } })).toBe(0);
  });
});

describe("入力の検証", () => {
  it("長すぎるタイトルの単語帳は作成しない", async () => {
    loginAs(owner);
    const before = await prisma.notebook.count({ where: { userId: owner.id } });
    const state = await createBlankNotebook(
      form({ title: "あ".repeat(NOTEBOOK_TITLE_MAX_LENGTH + 1) }),
    );
    expect(state.error).toBeTruthy();
    expect(await prisma.notebook.count({ where: { userId: owner.id } })).toBe(before);
  });

  it("長すぎる見出し語・値のカードは追加・更新しない", async () => {
    loginAs(owner);
    const longHead = await createCardAction(
      notebook.id,
      form({ head: "a".repeat(CARD_HEAD_MAX_LENGTH + 1) }),
    );
    const longValue = await createCardAction(
      notebook.id,
      form({ head: "chat", "row:0:意味": "あ".repeat(CARD_VALUE_MAX_LENGTH + 1) }),
    );
    expect(longHead.error).toBeTruthy();
    expect(longValue.error).toBeTruthy();
    expect(await prisma.card.count({ where: { notebookId: notebook.id } })).toBe(0);

    const card = await createCard(notebook.id, "chat");
    const updated = await updateCard(
      card.id,
      notebook.id,
      form({ head: "chat", "row:0:意味": "あ".repeat(CARD_VALUE_MAX_LENGTH + 1) }),
    );
    expect(updated.error).toBeTruthy();
    expect((await prisma.card.findUniqueOrThrow({ where: { id: card.id } })).data).toEqual({
      head: "chat",
      rows: [{ 意味: "chatの意味" }],
    });
  });

  it("長すぎる列名は追加しない", async () => {
    loginAs(owner);
    const state = await addNotebookColumn(
      notebook.id,
      form({ name: "a".repeat(COLUMN_NAME_MAX_LENGTH + 1) }),
    );
    expect(state.error).toBeTruthy();
    expect(
      (await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } })).columns,
    ).toEqual(["見出し語", "意味"]);
  });

  it("★の回数は上限に丸められる", async () => {
    const card = await createCard(notebook.id, "chat");
    loginAs(owner);
    await setStarCount(card.id, notebook.id, form({ count: "999999999" }));
    expect(
      (
        await prisma.cardProgress.findUniqueOrThrow({
          where: { cardId_userId: { cardId: card.id, userId: owner.id } },
        })
      ).starCount,
    ).toBe(MAX_STAR_COUNT);
  });
});
