import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import {
  addEditor,
  applyMigrations,
  createNotebook,
  createUser,
  redirectLocation,
} from "@/lib/server/test/db";

import { acceptInvite, createInvite, removeShare, revokeInvite } from "./sharing-actions.server";

vi.mock("@/lib/server/session.server", () => ({ requireUser: vi.fn() }));

const loginAs = (user: { id: string }) => vi.mocked(requireUser).mockResolvedValue(user as never);

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

describe("createInvite", () => {
  it("作成者は招待リンクを発行できる", async () => {
    loginAs(owner);
    await createInvite(notebook.id);
    expect(await prisma.notebookInvite.count({ where: { notebookId: notebook.id } })).toBe(1);
  });

  it("共同編集者や無関係なユーザーは発行できない", async () => {
    for (const user of [editor, stranger]) {
      loginAs(user);
      await expect(createInvite(notebook.id)).rejects.toThrow();
    }
    expect(await prisma.notebookInvite.count({ where: { notebookId: notebook.id } })).toBe(0);
  });
});

describe("revokeInvite", () => {
  it("作成者は招待リンクを失効できる", async () => {
    const invite = await prisma.notebookInvite.create({ data: { notebookId: notebook.id } });
    loginAs(owner);
    await revokeInvite(invite.id, notebook.id);
    expect(await prisma.notebookInvite.count({ where: { id: invite.id } })).toBe(0);
  });

  it("共同編集者は失効できない", async () => {
    const invite = await prisma.notebookInvite.create({ data: { notebookId: notebook.id } });
    loginAs(editor);
    await expect(revokeInvite(invite.id, notebook.id)).rejects.toThrow();
    expect(await prisma.notebookInvite.count({ where: { id: invite.id } })).toBe(1);
  });

  it("自分の単語帳の ID を使って、他人の単語帳の招待リンクを失効させることはできない", async () => {
    const other = await createUser();
    const othersNotebook = await createNotebook(other.id);
    const othersInvite = await prisma.notebookInvite.create({
      data: { notebookId: othersNotebook.id },
    });
    loginAs(owner);
    await expect(revokeInvite(othersInvite.id, notebook.id)).rejects.toThrow();
    expect(await prisma.notebookInvite.count({ where: { id: othersInvite.id } })).toBe(1);
  });
});

describe("removeShare", () => {
  it("作成者は共同編集者を外せる", async () => {
    const share = await prisma.notebookShare.findFirstOrThrow({ where: { userId: editor.id } });
    loginAs(owner);
    await removeShare(share.id, notebook.id);
    expect(await prisma.notebookShare.count({ where: { id: share.id } })).toBe(0);
  });

  it("共同編集者は自分以外も自分自身も外せない", async () => {
    const share = await prisma.notebookShare.findFirstOrThrow({ where: { userId: editor.id } });
    loginAs(editor);
    await expect(removeShare(share.id, notebook.id)).rejects.toThrow();
    expect(await prisma.notebookShare.count({ where: { id: share.id } })).toBe(1);
  });
});

describe("acceptInvite", () => {
  it("招待リンクで参加すると共同編集者になり、単語帳へ遷移する", async () => {
    const invite = await prisma.notebookInvite.create({ data: { notebookId: notebook.id } });
    loginAs(stranger);
    expect(await redirectLocation(() => acceptInvite(invite.token))).toBe(
      `/my-notebooks/${notebook.id}`,
    );
    expect(
      await prisma.notebookShare.count({
        where: { notebookId: notebook.id, userId: stranger.id },
      }),
    ).toBe(1);
  });

  it("同じ招待リンクを 2 回使っても、共同編集者は重複しない", async () => {
    const invite = await prisma.notebookInvite.create({ data: { notebookId: notebook.id } });
    loginAs(stranger);
    await redirectLocation(() => acceptInvite(invite.token));
    await redirectLocation(() => acceptInvite(invite.token));
    expect(
      await prisma.notebookShare.count({
        where: { notebookId: notebook.id, userId: stranger.id },
      }),
    ).toBe(1);
  });

  it("作成者が自分の招待リンクを開いても、共同編集者としては登録されない", async () => {
    const invite = await prisma.notebookInvite.create({ data: { notebookId: notebook.id } });
    loginAs(owner);
    await redirectLocation(() => acceptInvite(invite.token));
    expect(
      await prisma.notebookShare.count({ where: { notebookId: notebook.id, userId: owner.id } }),
    ).toBe(0);
  });

  it("存在しない(失効済みの)トークンでは参加できず、一覧へ戻される", async () => {
    loginAs(stranger);
    expect(await redirectLocation(() => acceptInvite("no-such-token"))).toBe("/my-notebooks");
    expect(await prisma.notebookShare.count({ where: { userId: stranger.id } })).toBe(0);
  });
});
