import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// 単語を2件入れた単語帳を作る
async function createNotebookWithCards(page: Page, baseURL: string, title: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  for (const [head, meaning] of [
    ["merci", "ありがとう"],
    ["bonjour", "こんにちは"],
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

test("「編集」を押すと表のすべての入力欄が編集でき、まとめて保存できる", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用のまとめて編集する単語帳");
  // 行ごとの「編集」は無く、表の上の「編集」を1回押すだけ
  await expect(table.getByRole("button", { name: "編集" })).toHaveCount(0);
  await page.getByRole("button", { name: "表を編集" }).click();

  // 2件ぶんの見出し語・意味がすべて入力欄になる
  const heads = table.getByRole("textbox", { name: "見出し語" });
  const meanings = table.getByRole("textbox", { name: "意味" });
  await expect(heads).toHaveCount(2);
  await expect(meanings).toHaveCount(2);
  await expect(heads.nth(0)).toHaveValue("merci");
  await expect(meanings.nth(1)).toHaveValue("こんにちは");

  await heads.nth(0).fill("merci beaucoup");
  await meanings.nth(1).fill("やあ");
  await page.getByRole("button", { name: "保存", exact: true }).click();

  // 保存すると表示に戻り、変更が反映されている
  await expect(table.getByRole("textbox")).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "merci beaucoup", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "やあ", exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("table").first().getByRole("cell", { name: "やあ", exact: true }),
  ).toBeVisible();
});

test("まとめて編集は、キャンセルすると変更を捨てる", async ({ page, baseURL }) => {
  const table = await createNotebookWithCards(
    page,
    baseURL!,
    "e2e 用のまとめて編集を取り消す単語帳",
  );
  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("textbox", { name: "意味" }).first().fill("変えたけれど取り消す");
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();

  await expect(table.getByRole("textbox")).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "ありがとう", exact: true })).toBeVisible();
});

test("まとめて編集で見出し語を空にすると、何も保存せずに理由を表示する", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(
    page,
    baseURL!,
    "e2e 用のまとめて編集の入力チェックの単語帳",
  );
  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("textbox", { name: "意味" }).first().fill("保存されないはず");
  await table.getByRole("textbox", { name: "見出し語" }).nth(1).fill("");
  await page.getByRole("button", { name: "保存", exact: true }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  // 編集中のまま。再読み込みしても、どちらの単語も保存されていない
  await expect(table.getByRole("textbox", { name: "見出し語" })).toHaveCount(2);
  await page.reload();
  const reloaded = page.getByRole("table").first();
  await expect(reloaded.getByRole("cell", { name: "ありがとう", exact: true })).toBeVisible();
  await expect(reloaded.getByRole("cell", { name: "bonjour", exact: true })).toBeVisible();
});

test("編集中も表の下の＋で行を足せ、保存すると新しい単語として加わる（空の行は無視する）", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の編集中に行を足す単語帳");
  await page.getByRole("button", { name: "表を編集" }).click();

  await table.getByRole("button", { name: "表に行を追加" }).click();
  const heads = table.getByRole("textbox", { name: "見出し語" });
  await expect(heads).toHaveCount(3);
  await expect(heads.nth(2)).toBeFocused();
  await heads.nth(2).fill("au revoir");
  await table.getByRole("textbox", { name: "意味" }).nth(2).fill("さようなら");
  // 何も入力しない行をもう1つ足しておく
  await table.getByRole("button", { name: "表に行を追加" }).click();
  await expect(heads).toHaveCount(4);

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(table.getByRole("textbox")).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "au revoir", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "さようなら", exact: true })).toBeVisible();
  // 空の行は単語にならない（merci・bonjour・au revoir の3件）
  await expect(table.locator("tbody tr[data-card-index]")).toHaveCount(3);
});

test("編集中は ↑↓ で上下の行へ移り、いちばん下の行で ↓ を押すと新しい行が増える", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の編集中に矢印で移る単語帳");
  await page.getByRole("button", { name: "表を編集" }).click();
  const heads = table.getByRole("textbox", { name: "見出し語" });
  const meanings = table.getByRole("textbox", { name: "意味" });

  await meanings.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  await expect(meanings.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(meanings.nth(0)).toBeFocused();

  // いちばん下の行で ↓ を押すと、新しい行が増えて、同じ列の欄へ移る
  await meanings.nth(1).focus();
  await page.keyboard.press("ArrowDown");
  await expect(meanings).toHaveCount(3);
  await expect(meanings.nth(2)).toBeFocused();
  await expect(heads).toHaveCount(3);

  // 文字の最後で → を押すと、右隣の欄へ移る
  await heads.nth(0).focus();
  await heads.nth(0).press("End");
  await page.keyboard.press("ArrowRight");
  await expect(meanings.nth(0)).toBeFocused();
});
