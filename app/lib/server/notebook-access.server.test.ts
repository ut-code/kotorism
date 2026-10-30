import { beforeAll, describe, expect, it } from "vite-plus/test";

import { getNotebookRole, requireNotebookRole } from "./notebook-access.server";
import { addEditor, applyMigrations, createNotebook, createUser } from "./test/db";

let owner: { id: string };
let editor: { id: string };
let stranger: { id: string };
let notebook: { id: string };

beforeAll(async () => {
  await applyMigrations();
  [owner, editor, stranger] = await Promise.all([createUser(), createUser(), createUser()]);
  notebook = await createNotebook(owner.id);
  await addEditor(notebook.id, editor.id);
});

describe("getNotebookRole", () => {
  it("作成者は owner、招待で参加した人は editor", async () => {
    expect(await getNotebookRole(notebook.id, owner.id)).toBe("owner");
    expect(await getNotebookRole(notebook.id, editor.id)).toBe("editor");
  });

  it("無関係なユーザーや存在しない単語帳は null", async () => {
    expect(await getNotebookRole(notebook.id, stranger.id)).toBeNull();
    expect(await getNotebookRole("no-such-notebook", owner.id)).toBeNull();
  });

  it("公開設定(isPublic)は編集権限を与えない", async () => {
    const publicNotebook = await createNotebook(owner.id, { isPublic: true });
    expect(await getNotebookRole(publicNotebook.id, stranger.id)).toBeNull();
  });
});

describe("requireNotebookRole", () => {
  it("member を要求すると、owner と editor は通り、それ以外は拒否される", async () => {
    await expect(requireNotebookRole(notebook.id, owner.id, "member")).resolves.toBe("owner");
    await expect(requireNotebookRole(notebook.id, editor.id, "member")).resolves.toBe("editor");
    await expect(requireNotebookRole(notebook.id, stranger.id, "member")).rejects.toThrow();
  });

  it("owner を要求すると、作成者だけが通る", async () => {
    await expect(requireNotebookRole(notebook.id, owner.id, "owner")).resolves.toBe("owner");
    await expect(requireNotebookRole(notebook.id, editor.id, "owner")).rejects.toThrow();
    await expect(requireNotebookRole(notebook.id, stranger.id, "owner")).rejects.toThrow();
  });

  it("存在しない単語帳は拒否される", async () => {
    await expect(requireNotebookRole("no-such-notebook", owner.id, "member")).rejects.toThrow();
  });
});
