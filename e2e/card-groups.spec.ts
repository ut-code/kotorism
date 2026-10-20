import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// 1つの単語に複数の組（多義語）を持たせる。組が複数ある単語は、見出し語のマスが組の数だけ縦に結合される

// 単語を入れた単語帳を作る
async function createNotebookWithCards(page: Page, baseURL: string, title: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  for (const [head, meaning] of [
    ["light", "光"],
    ["dark", "暗い"],
  ]) {
    const created = await page.request.post(notebookUrl, {
      form: { intent: "createCard", head, "row:0:意味": meaning },
      headers: { Origin: baseURL },
    });
    expect(created.ok()).toBe(true);
  }
  await page.reload();
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  return page.getByRole("table").first();
}

test("表の下の＋で見出し語を空けて追加すると、すぐ上の単語の組になる", async ({ page }) => {
  await createNotebook(page, "e2e 用の組を＋で足す単語帳");
  const table = page.getByRole("table").first();

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await table.getByRole("textbox", { name: "見出し語" }).fill("light");
  await table.getByRole("textbox", { name: "意味" }).fill("光");
  await page.keyboard.press("Enter");
  await expect(table.getByRole("cell", { name: "光", exact: true })).toBeVisible();

  // 見出し語は空のまま、意味だけ入れて追加する
  await table.getByRole("textbox", { name: "意味" }).fill("軽い");
  await page.keyboard.press("Enter");

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toBeVisible();
  const head = table.getByRole("cell", { name: "light", exact: true });
  await expect(head).toHaveCount(1);
  await expect(head).toHaveAttribute("rowspan", "2");
});

test("まとめて編集で、単語の右の＋から組を足し、マスを全部空にした組は消える", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の組を編集する単語帳");

  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("button", { name: "「light」に組を追加" }).click();
  // 足した組の最初の欄から入力できる
  const added = table.getByRole("textbox", { name: "意味" }).nth(1);
  await expect(added).toBeFocused();
  await added.fill("軽い");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "light", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );

  // 組のマスを全部空にして保存すると、その組を消す
  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("textbox", { name: "意味" }).nth(1).fill("");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "light", exact: true })).toHaveAttribute(
    "rowspan",
    "1",
  );
});

test("まとめて編集で表の下に足した行の見出し語が空なら、すぐ上の単語の組になる", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の行を組にする単語帳");

  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("button", { name: "表に行を追加" }).click();
  await table.getByRole("textbox", { name: "意味" }).last().fill("黒っぽい");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(table.getByRole("cell", { name: "黒っぽい", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "dark", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );
});
