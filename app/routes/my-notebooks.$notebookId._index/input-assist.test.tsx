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

async function chooseLanguage(
  user: Awaited<ReturnType<typeof renderNotebook>>["user"],
  label: string,
) {
  const select = screen.getByRole("combobox", { name: "入力補助の言語" });
  await user.selectOptions(select, label);
  // 保存が終わるまで待つ
  await waitFor(() => expect(select).toBeEnabled());
}

// 補助で書き換えたあとに続けて打つ流れ（フランス語・中国語）は e2e(e2e/notebook-input-assist.spec.ts)で確かめる。
// 補助は DOM の値を直接書き換えるが、user-event は入力値を自前で追跡するため、続けて打つと古い値に重なってしまう
describe("単語帳の入力補助", () => {
  it("言語が指定なしの単語帳には、入力補助を出さない", async () => {
    const { user, table } = await renderNotebook(notebookId);
    expect(screen.getByRole("combobox", { name: "入力補助の言語" })).toHaveValue("");
    await user.click(table.getByRole("button", { name: "表に単語を追加" }));
    await user.keyboard("cafe{ArrowUp}");
    expect(table.getByRole("textbox", { name: "見出し語" })).toHaveValue("cafe");
    expect(screen.queryByRole("toolbar", { name: "入力補助" })).not.toBeInTheDocument();
  });

  it("表全体の編集中も、直前の文字が切り替えられるなら ↑ は欄の移動より切り替えを優先し、そうでなければ上の欄へ移る", async () => {
    await seedNotebook(notebookId, { cards: [["uno"], ["dos"]] });
    const { user, table } = await renderNotebook(notebookId);
    await chooseLanguage(user, "スペイン語");
    await user.click(screen.getByRole("button", { name: "表を編集" }));
    const heads = () => table.getAllByRole("textbox", { name: "見出し語" });
    expect(heads()).toHaveLength(2);

    // 直前の文字（s）は切り替えられないので、上の欄へ移る
    await user.click(heads()[1]);
    await user.keyboard("{End}{ArrowUp}");
    expect(heads()[0]).toHaveFocus();

    // 文字を打った直後でなくても、直前の文字（o）が切り替えられるなら ↑↓ は切り替えに使う
    await user.keyboard("{End}{ArrowUp}");
    expect(heads()[0]).toHaveValue("unó");
    expect(heads()[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(heads()[0]).toHaveValue("unó");
    expect(heads()[0]).toHaveFocus();
  });
});
