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

// 1つの単語に複数の組（多義語）を持たせる。組が複数ある単語は、見出し語のマスが組の数だけ縦に結合される
async function saveAndWait(user: Awaited<ReturnType<typeof renderNotebook>>["user"]) {
  await user.click(screen.getByRole("button", { name: "保存" }));
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await screen.findByRole("button", { name: "表を編集" });
}

describe("組（多義語）", () => {
  it("表の下の＋で見出し語を空けて追加すると、すぐ上の単語の組になる", async () => {
    const { user, table } = await renderNotebook(notebookId);
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    await user.type(table.getByRole("textbox", { name: "見出し語" }), "light");
    const meaning = table.getByRole("textbox", { name: "意味" });
    await user.type(meaning, "光{Enter}");
    await waitFor(() => expect(meaning).toHaveValue(""));
    // 見出し語は空のまま、意味だけ入れて追加する
    await user.type(meaning, "軽い{Enter}");
    await waitFor(() => expect(meaning).toHaveValue(""));

    expect(await table.findByRole("cell", { name: "軽い" })).toBeInTheDocument();
    expect(table.getByRole("cell", { name: "light" })).toHaveAttribute("rowspan", "2");
    expect(await savedCards(notebookId)).toEqual([
      { head: "light", rows: [{ 意味: "光" }, { 意味: "軽い" }] },
    ]);
  });

  describe("まとめて編集", () => {
    beforeEach(() =>
      seedNotebook(notebookId, {
        cards: [
          ["light", { 意味: "光" }],
          ["dark", { 意味: "暗い" }],
        ],
      }),
    );

    it("単語の右の＋から組を足し、マスを全部空にした組は消える", async () => {
      const { user, table } = await renderNotebook(notebookId);
      await user.click(screen.getByRole("button", { name: "表を編集" }));
      await user.click(table.getByRole("button", { name: "「light」に組を追加" }));
      // 足した組の最初の欄から入力できる
      const added = table.getAllByRole("textbox", { name: "意味" })[1];
      expect(added).toHaveFocus();
      await user.type(added, "軽い");
      await saveAndWait(user);
      expect(table.getByRole("cell", { name: "軽い" })).toBeInTheDocument();
      expect(table.getByRole("cell", { name: "light" })).toHaveAttribute("rowspan", "2");

      // 組のマスを全部空にして保存すると、その組を消す
      await user.click(screen.getByRole("button", { name: "表を編集" }));
      await user.clear(table.getAllByRole("textbox", { name: "意味" })[1]);
      await saveAndWait(user);
      expect(table.queryByRole("cell", { name: "軽い" })).not.toBeInTheDocument();
      expect(table.getByRole("cell", { name: "light" })).toHaveAttribute("rowspan", "1");
    });

    it("表の下に足した行の見出し語が空なら、すぐ上の単語の組になる", async () => {
      const { user, table } = await renderNotebook(notebookId);
      await user.click(screen.getByRole("button", { name: "表を編集" }));
      await user.click(table.getByRole("button", { name: "表に行を追加" }));
      await user.type(table.getAllByRole("textbox", { name: "意味" }).at(-1)!, "黒っぽい");
      await saveAndWait(user);
      expect(table.getByRole("cell", { name: "黒っぽい" })).toBeInTheDocument();
      expect(table.getByRole("cell", { name: "dark" })).toHaveAttribute("rowspan", "2");
    });
  });

  describe("マスの結合・分割", () => {
    // 品詞が「名詞」で続く多義語
    beforeEach(() =>
      seedNotebook(notebookId, {
        columns: ["見出し語", "意味", "品詞"],
        cards: [
          [
            "cost",
            { 意味: "値段が～である", 品詞: "動詞" },
            { 意味: "犠牲", 品詞: "名詞" },
            { 意味: "費用", 品詞: "名詞" },
          ],
        ],
      }),
    );

    it("結合しているマスを分割すると、いちばん下の組のマスが別の入力欄になる", async () => {
      const { user, table } = await renderNotebook(notebookId);
      expect(table.getByRole("cell", { name: "名詞" })).toHaveAttribute("rowspan", "2");

      await user.click(screen.getByRole("button", { name: "表を編集" }));
      // 編集中も、同じ値が続く「名詞」のマスは結合した1つの入力欄になっている
      expect(table.getAllByRole("textbox", { name: "品詞" })).toHaveLength(2);
      await user.click(table.getByRole("button", { name: "「品詞」の結合を分割" }));
      const partOfSpeech = table.getAllByRole("textbox", { name: "品詞" });
      expect(partOfSpeech).toHaveLength(3);
      // 切り離したマスは空欄から入力し直す
      expect(partOfSpeech[2]).toHaveValue("");
      await user.type(partOfSpeech[2], "名詞（複数形）");
      await saveAndWait(user);

      expect(table.getByRole("cell", { name: "名詞" })).toHaveAttribute("rowspan", "1");
      expect(table.getByRole("cell", { name: "名詞（複数形）" })).toBeInTheDocument();
    });

    it("マスを下の組と結合すると、結合した組すべてに同じ値を保存する", async () => {
      // 下の組のマスに別の値が入っているときは、上のマスの値にそろえてよいか確認する
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const { user, table } = await renderNotebook(notebookId);
      await user.click(screen.getByRole("button", { name: "表を編集" }));
      await user.click(table.getAllByRole("button", { name: "「意味」を下の組と結合" })[1]);
      const meaning = table.getAllByRole("textbox", { name: "意味" });
      expect(meaning).toHaveLength(2);
      await user.clear(meaning[1]);
      await user.type(meaning[1], "費用・犠牲");
      await saveAndWait(user);

      expect(table.getByRole("cell", { name: "費用・犠牲" })).toHaveAttribute("rowspan", "2");
      expect(table.queryByRole("cell", { name: "犠牲" })).not.toBeInTheDocument();
      expect(table.queryByRole("cell", { name: "費用" })).not.toBeInTheDocument();
    });
  });
});
