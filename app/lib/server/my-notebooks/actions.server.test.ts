import { beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { prisma } from "@/lib/server/prisma.server";
import { sortNotebooks } from "@/lib/shared/notebook-order";
import { toStudyDay } from "@/lib/shared/study-calendar";
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
  moveCard,
  moveNotebook,
  moveNotebookColumn,
  renameNotebook,
  setStarCount,
  toggleNotebookFavorite,
  toggleNotebookPublic,
  toggleNotebookStudied,
  toggleStar,
  updateCard,
  updateCards,
  updateNotebookLanguage,
} from "./actions.server";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));
// 学習記録はこのテストの対象外。実物は教材のセクション一覧(MDX)まで読み込むため差し替える
vi.mock("@/lib/server/study-events.server", () => ({ recordStudyEvent: vi.fn() }));

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
    // 開いたページでタイトルを入力できるよう、?new=1 を付けて開く
    expect(location).toBe(`/my-notebooks/${created.id}?new=1`);
  });

  it("タイトルが無い・空(空白のみ)なら「無題の単語帳」で作成する", async () => {
    loginAs(owner);
    const location = await redirectLocation(() => createBlankNotebook(form({})));
    const created = await prisma.notebook.findFirstOrThrow({
      where: { userId: owner.id, title: "無題の単語帳" },
    });
    expect(location).toBe(`/my-notebooks/${created.id}?new=1`);

    await redirectLocation(() => createBlankNotebook(form({ title: "   " })));
    expect(
      await prisma.notebook.count({ where: { userId: owner.id, title: "無題の単語帳" } }),
    ).toBe(2);
  });
});

describe("renameNotebook", () => {
  it("作成者はタイトルを変えられる（前後の空白は取り除く）", async () => {
    loginAs(owner);
    expect(await renameNotebook(notebook.id, form({ title: " 11月の英単語 " }))).toEqual({});
    const renamed = await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } });
    expect(renamed.title).toBe("11月の英単語");
  });

  it("空のタイトルにはできない", async () => {
    loginAs(owner);
    const state = await renameNotebook(notebook.id, form({ title: "  " }));
    expect(state.error).toBeTruthy();
    const unchanged = await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } });
    expect(unchanged.title).toBe("テスト用の単語帳");
  });

  it("自分の別の単語帳と名前が重なるときは保存せず、番号・日付を付けた名前の候補を返す", async () => {
    await prisma.notebook.create({
      data: { title: "フランス語", userId: owner.id, columns: ["見出し語", "意味"] },
    });
    loginAs(owner);
    const today = toStudyDay(new Date());
    const state = await renameNotebook(notebook.id, form({ title: "フランス語" }));
    expect(state.duplicate).toEqual({
      title: "フランス語",
      numbered: "フランス語 1",
      dated: `フランス語 ${today}`,
    });
    const unchanged = await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } });
    expect(unchanged.title).toBe("テスト用の単語帳");
  });

  it("名前が重なるときに選んだ方法（このまま・番号・日付）で保存する", async () => {
    await prisma.notebook.create({
      data: { title: "フランス語", userId: owner.id, columns: ["見出し語", "意味"] },
    });
    loginAs(owner);
    const titleAfter = async (onDuplicate: string) => {
      expect(await renameNotebook(notebook.id, form({ title: "フランス語", onDuplicate }))).toEqual(
        {},
      );
      return (await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } })).title;
    };
    expect(await titleAfter("number")).toBe("フランス語 1");
    expect(await titleAfter("date")).toBe(`フランス語 ${toStudyDay(new Date())}`);
    expect(await titleAfter("keep")).toBe("フランス語");
  });

  it("他人の単語帳や、自分自身のいまの名前とは重なっていても確かめない", async () => {
    await prisma.notebook.create({
      data: { title: "ドイツ語", userId: stranger.id, columns: ["見出し語", "意味"] },
    });
    loginAs(owner);
    expect(await renameNotebook(notebook.id, form({ title: "ドイツ語" }))).toEqual({});
    expect(await renameNotebook(notebook.id, form({ title: "ドイツ語" }))).toEqual({});
  });

  it("共同編集者・他人はタイトルを変えられない", async () => {
    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(renameNotebook(notebook.id, form({ title: "乗っ取り" }))).rejects.toThrow();
    }
  });
});

describe("moveCard", () => {
  it("単語を指定した位置へ動かし、並びの順に position を振り直す", async () => {
    const [a, b, c] = [
      await createCard(notebook.id, "a", 0),
      await createCard(notebook.id, "b", 1),
      await createCard(notebook.id, "c", 2),
    ];
    loginAs(editor);
    // a（0番）を、いちばん後ろ（3番の間）へ
    expect(await moveCard(notebook.id, form({ cardId: a.id, from: "0", insertAt: "3" }))).toEqual(
      {},
    );
    const ordered = await prisma.card.findMany({
      where: { notebookId: notebook.id },
      orderBy: { position: "asc" },
    });
    expect(ordered.map((card) => card.id)).toEqual([b.id, c.id, a.id]);
  });

  it("送られてきた単語と、その位置の単語が食い違っていれば何もしない", async () => {
    const a = await createCard(notebook.id, "a", 0);
    await createCard(notebook.id, "b", 1);
    loginAs(owner);
    const state = await moveCard(notebook.id, form({ cardId: a.id, from: "1", insertAt: "0" }));
    expect(state.error).toBeTruthy();
  });
});

describe("moveNotebookColumn", () => {
  it("見出し語の列より後ろの列を並べ替える", async () => {
    await prisma.notebook.update({
      where: { id: notebook.id },
      data: { columns: ["見出し語", "意味", "例文", "発音"] },
    });
    loginAs(owner);
    // 発音（3番）を、意味（1番）の前へ
    expect(await moveNotebookColumn(notebook.id, form({ from: "3", insertAt: "1" }))).toEqual({});
    const moved = await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } });
    expect(moved.columns).toEqual(["見出し語", "発音", "意味", "例文"]);
  });

  it("見出し語の列は動かせず、見出し語の列の前にも入れられない", async () => {
    loginAs(owner);
    expect(
      (await moveNotebookColumn(notebook.id, form({ from: "0", insertAt: "2" }))).error,
    ).toBeTruthy();
    expect(
      (await moveNotebookColumn(notebook.id, form({ from: "1", insertAt: "0" }))).error,
    ).toBeTruthy();
  });
});

describe("updateCards", () => {
  it("既存の単語をまとめて書き換え、新しい行は後ろに単語として加える（空の行は飛ばす）", async () => {
    const chat = await createCard(notebook.id, "chat", 0);
    loginAs(editor);
    const state = await updateCards(
      notebook.id,
      form({
        cardId: chat.id,
        [`card:${chat.id}:head`]: "chien",
        [`card:${chat.id}:row:0:意味`]: "犬",
        newCardId: "new-1",
        "card:new-1:head": "oiseau",
        "card:new-1:row:0:意味": "鳥",
      }),
    );
    expect(state).toEqual({});
    const cards = await prisma.card.findMany({
      where: { notebookId: notebook.id },
      orderBy: { position: "asc" },
    });
    expect(cards.map((card) => card.data)).toEqual([
      { head: "chien", rows: [{ 意味: "犬" }] },
      { head: "oiseau", rows: [{ 意味: "鳥" }] },
    ]);
  });

  it("どれか1つでも入力に問題があれば、何も保存しない", async () => {
    const chat = await createCard(notebook.id, "chat", 0);
    loginAs(owner);
    const state = await updateCards(
      notebook.id,
      form({
        cardId: chat.id,
        [`card:${chat.id}:head`]: "chien",
        newCardId: "new-1",
        "card:new-1:head": "oiseau",
        "card:new-1:row:0:意味": "あ".repeat(CARD_VALUE_MAX_LENGTH + 1),
      }),
    );
    expect(state.error).toBeTruthy();
    const unchanged = await prisma.card.findMany({ where: { notebookId: notebook.id } });
    expect(unchanged.map((card) => (card.data as { head: string }).head)).toEqual(["chat"]);
  });
});

describe("1つの単語に複数の組（多義語）", () => {
  const cardsData = async () =>
    (
      await prisma.card.findMany({
        where: { notebookId: notebook.id },
        orderBy: { position: "asc" },
      })
    ).map((card) => card.data);

  it("表の＋で見出し語を空けて追加すると、いちばん下の単語の新しい組になる", async () => {
    await createCard(notebook.id, "chat", 0);
    await createCard(notebook.id, "light", 1);
    loginAs(editor);
    const state = await createCardAction(notebook.id, form({ head: " ", "row:0:意味": "軽い" }));
    expect(state).toEqual({ added: "light" });
    expect(await cardsData()).toEqual([
      { head: "chat", rows: [{ 意味: "chatの意味" }] },
      { head: "light", rows: [{ 意味: "lightの意味" }, { 意味: "軽い" }] },
    ]);
  });

  it("まとめて編集で、組を足したり、全部のマスを空にした組を消したりできる", async () => {
    const light = await createCard(notebook.id, "light", 0);
    loginAs(owner);
    const field = (name: string) => `card:${light.id}:${name}`;
    const state = await updateCards(
      notebook.id,
      form({
        cardId: light.id,
        [field("head")]: "light",
        [field("row:0:意味")]: "",
        [field("row:1:意味")]: "軽い",
        [field("row:2:意味")]: "明るい",
      }),
    );
    expect(state).toEqual({});
    expect(await cardsData()).toEqual([
      { head: "light", rows: [{ 意味: "軽い" }, { 意味: "明るい" }] },
    ]);
  });

  it("まとめて編集で足した行の見出し語が空なら、すぐ上の単語の組にする", async () => {
    const light = await createCard(notebook.id, "light", 0);
    loginAs(owner);
    const formData = form({
      cardId: light.id,
      [`card:${light.id}:head`]: "light",
      [`card:${light.id}:row:0:意味`]: "光",
      "card:new-1:head": "",
      "card:new-1:row:0:意味": "軽い",
      "card:new-2:head": "dark",
      "card:new-2:row:0:意味": "暗い",
      "card:new-3:head": "",
      "card:new-3:row:0:意味": "黒っぽい",
    });
    for (const id of ["new-1", "new-2", "new-3"]) formData.append("newCardId", id);
    expect(await updateCards(notebook.id, formData)).toEqual({});
    expect(await cardsData()).toEqual([
      { head: "light", rows: [{ 意味: "光" }, { 意味: "軽い" }] },
      { head: "dark", rows: [{ 意味: "暗い" }, { 意味: "黒っぽい" }] },
    ]);
  });

  it("上に単語が無いのに見出し語が空なら、エラーにして何も保存しない", async () => {
    loginAs(owner);
    expect(
      (await createCardAction(notebook.id, form({ head: "", "row:0:意味": "軽い" }))).error,
    ).toBeTruthy();
    const state = await updateCards(
      notebook.id,
      form({ newCardId: "new-1", "card:new-1:head": "", "card:new-1:row:0:意味": "軽い" }),
    );
    expect(state.error).toBeTruthy();
    expect(await prisma.card.count({ where: { notebookId: notebook.id } })).toBe(0);
  });
});

describe("My単語帳の一覧のお気に入り・学習済み・並べ替え", () => {
  // owner の単語帳を、一覧に並ぶ順（sortNotebooks）の id で返す
  async function listOrder() {
    const notebooks = await prisma.notebook.findMany({ where: { userId: owner.id } });
    return sortNotebooks(notebooks).map((n) => n.title);
  }
  async function createOwned(title: string, createdAt: string) {
    return prisma.notebook.create({
      data: {
        title,
        userId: owner.id,
        columns: ["見出し語", "意味"],
        createdAt: new Date(createdAt),
      },
    });
  }

  it("お気に入りにすると一覧の一番上に並び、外すと元の並びに戻る", async () => {
    await prisma.notebook.delete({ where: { id: notebook.id } });
    const a = await createOwned("A", "2026-01-01");
    await createOwned("B", "2026-02-01");
    loginAs(owner);
    expect(await listOrder()).toEqual(["B", "A"]);
    expect(await toggleNotebookFavorite(a.id)).toEqual({});
    expect(await listOrder()).toEqual(["A", "B"]);
    await toggleNotebookFavorite(a.id);
    expect(await listOrder()).toEqual(["B", "A"]);
  });

  it("並べ替えると、その順に並び順を振り直す（お気に入りとそれ以外の境目はまたがない）", async () => {
    await prisma.notebook.delete({ where: { id: notebook.id } });
    const a = await createOwned("A", "2026-01-01");
    const b = await createOwned("B", "2026-02-01");
    const c = await createOwned("C", "2026-03-01");
    loginAs(owner);
    expect(await listOrder()).toEqual(["C", "B", "A"]);
    // A を C の前（いちばん上）へ
    expect(await moveNotebook(form({ notebookId: a.id, beforeNotebookId: c.id }))).toEqual({});
    expect(await listOrder()).toEqual(["A", "C", "B"]);

    // C をお気に入りにしてから、B をお気に入りの C の前へ動かそうとしても、C より上には行かない
    await toggleNotebookFavorite(c.id);
    expect(await listOrder()).toEqual(["C", "A", "B"]);
    await moveNotebook(form({ notebookId: b.id, beforeNotebookId: c.id }));
    expect(await listOrder()).toEqual(["C", "B", "A"]);
    // 前に入れる単語帳を指定しなければ、自分のまとまりのいちばん後ろへ
    await moveNotebook(form({ notebookId: b.id }));
    expect(await listOrder()).toEqual(["C", "A", "B"]);
  });

  it("新しく作った単語帳は、お気に入り以外の一番上に並ぶ", async () => {
    await prisma.notebook.delete({ where: { id: notebook.id } });
    const a = await createOwned("A", "2026-01-01");
    const b = await createOwned("B", "2026-02-01");
    loginAs(owner);
    await moveNotebook(form({ notebookId: a.id, beforeNotebookId: b.id }));
    await toggleNotebookFavorite(b.id);
    await redirectLocation(() => createBlankNotebook(form({ title: "新しい" })));
    expect(await listOrder()).toEqual(["B", "新しい", "A"]);
  });

  it("学習済みにすると一覧の一番下にまとまり、学習中に戻すと元のまとまりへ戻る", async () => {
    await prisma.notebook.delete({ where: { id: notebook.id } });
    const a = await createOwned("A", "2026-01-01");
    await createOwned("B", "2026-02-01");
    const c = await createOwned("C", "2026-03-01");
    loginAs(owner);
    await toggleNotebookFavorite(c.id);
    expect(await listOrder()).toEqual(["C", "B", "A"]);
    // お気に入りの C を学習済みにしても、学習済みとして一番下へ
    expect(await toggleNotebookStudied(c.id)).toEqual({});
    expect(await listOrder()).toEqual(["B", "A", "C"]);
    await toggleNotebookStudied(a.id);
    expect(await listOrder()).toEqual(["B", "C", "A"]);
    // 学習中に戻すと、お気に入りの印が残っている C は一番上へ戻る
    await toggleNotebookStudied(c.id);
    expect(await listOrder()).toEqual(["C", "B", "A"]);
  });

  it("共同編集者・他人は、お気に入り・並べ替えをできない", async () => {
    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(toggleNotebookFavorite(notebook.id)).rejects.toThrow();
      await expect(toggleNotebookStudied(notebook.id)).rejects.toThrow();
      const state = await moveNotebook(form({ notebookId: notebook.id }));
      expect(state.error).toBeTruthy();
    }
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

describe("updateNotebookLanguage", () => {
  const languageOf = async () =>
    (await prisma.notebook.findUniqueOrThrow({ where: { id: notebook.id } })).language;

  it("作成者は言語を選べ、空にすると指定なしに戻る", async () => {
    loginAs(owner);
    expect(await updateNotebookLanguage(notebook.id, form({ language: "french" }))).toEqual({});
    expect(await languageOf()).toBe("french");
    expect(await updateNotebookLanguage(notebook.id, form({ language: "" }))).toEqual({});
    expect(await languageOf()).toBeNull();
  });

  it("4言語以外は保存しない", async () => {
    loginAs(owner);
    const state = await updateNotebookLanguage(notebook.id, form({ language: "english" }));
    expect(state.error).toBeTruthy();
    expect(await languageOf()).toBeNull();
  });

  it("共同編集者・ほかの人は変えられない", async () => {
    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(
        updateNotebookLanguage(notebook.id, form({ language: "chinese" })),
      ).rejects.toThrow();
    }
    expect(await languageOf()).toBeNull();
  });
});
