import { expect, test } from "@playwright/test";

import { createNotebook } from "./helpers";

// 単語帳を作って単語を足す、いちばん基本の流れだけをビルドしたサーバーで確かめる。表の細かい操作は
// app/routes/my-notebooks.$notebookId._index/*.test.tsx(本物の action とインメモリ DB)で確かめる

test("表の下の＋から、表の中で単語を続けて追加できる", async ({ page }) => {
  await createNotebook(page, "e2e 用の表から追加する単語帳");
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  const table = page.getByRole("table").first();

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const head = table.getByRole("textbox", { name: "見出し語" });
  await expect(head).toBeFocused();
  await head.fill("merci");
  await table.getByRole("textbox", { name: "意味" }).fill("ありがとう");
  await page.keyboard.press("Enter");

  // 追加した単語が表の行として並び、入力行は空に戻って見出し語の欄から続けて入力できる
  await expect(table.getByRole("cell", { name: "merci", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "ありがとう", exact: true })).toBeVisible();
  await expect(head).toHaveValue("");
  await expect(head).toBeFocused();

  await head.fill("bonjour");
  await page.keyboard.press("Enter");
  await expect(table.getByRole("cell", { name: "bonjour", exact: true })).toBeVisible();

  // Esc で入力行を閉じる
  await page.keyboard.press("Escape");
  await expect(table.getByRole("textbox", { name: "見出し語" })).toHaveCount(0);
  await expect(table.getByRole("button", { name: "表に単語を追加" })).toBeVisible();
});
