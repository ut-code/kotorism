import { expect, test } from "@playwright/test";

import { createNotebook } from "./helpers";

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

test("表の見出し行の＋から、表の中で列を追加できる", async ({ page }) => {
  await createNotebook(page, "e2e 用の表から列を追加する単語帳");
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  const table = page.getByRole("table").first();

  await table.getByRole("button", { name: "表に列を追加" }).click();
  const name = table.getByRole("textbox", { name: "新しい列の名前" });
  await expect(name).toBeFocused();
  await name.fill("例文");
  await page.keyboard.press("Enter");

  await expect(table.getByRole("columnheader", { name: "例文", exact: true })).toBeVisible();
  await expect(table.getByRole("textbox", { name: "新しい列の名前" })).toHaveCount(0);

  // 追加した列にも、表の下の＋から入力できる
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await expect(table.getByRole("textbox", { name: "例文" })).toBeVisible();
});

test("表の下の入力行は、矢印キーで隣の入力欄へ移れる（文字の途中ではカーソルが動くだけ）", async ({
  page,
  baseURL,
}) => {
  await createNotebook(page, "e2e 用の矢印キーで移る単語帳");
  // 列を3つ（見出し語・意味・例文）にする
  const added = await page.request.post(new URL(page.url()).pathname, {
    form: { intent: "addColumn", name: "例文" },
    headers: { Origin: baseURL! },
  });
  expect(added.ok()).toBe(true);
  await page.reload();
  const table = page.getByRole("table").first();
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const head = table.getByRole("textbox", { name: "見出し語" });
  const meaning = table.getByRole("textbox", { name: "意味" });
  const example = table.getByRole("textbox", { name: "例文" });

  await head.fill("merci");
  // 文字の最後で → を押すと、右の欄へ移る
  await page.keyboard.press("ArrowRight");
  await expect(meaning).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(example).toBeFocused();
  // いちばん右の欄ではそれ以上移らない
  await page.keyboard.press("ArrowRight");
  await expect(example).toBeFocused();

  // 空の欄（カーソルが先頭）で ← を押すと、左の欄へ移る
  await page.keyboard.press("ArrowLeft");
  await expect(meaning).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(head).toBeFocused();

  // 文字の途中では、欄の中でカーソルが動くだけで移らない
  await head.press("End");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(head).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(head).toBeFocused();
});

test("単語が1件も無いとき、＋で最初の単語を入力している間は「まだ単語がありません」を出さない", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用の最初の単語を入れる単語帳");
  const table = page.getByRole("table").first();
  const empty = table.getByText("まだ単語がありません");
  await expect(empty).toBeVisible();

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await expect(empty).toHaveCount(0);

  // 入力をやめて閉じると、また表示する
  await page.keyboard.press("Escape");
  await expect(empty).toBeVisible();
});

test("表の下の入力行では、入力中も＋が見え、↓ で単語を加えて次の空の行へ進み、「キャンセル」で閉じる", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用の下矢印で行を足す単語帳");
  const table = page.getByRole("table").first();
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const head = table.getByRole("textbox", { name: "見出し語" });

  // 入力中も＋は見えている
  await expect(table.getByRole("button", { name: "表に単語を追加" })).toBeVisible();
  // 「閉じる」ではなく「キャンセル」
  await expect(table.getByRole("button", { name: "閉じる" })).toHaveCount(0);
  await expect(table.getByRole("button", { name: "キャンセル" })).toBeVisible();

  // ↓ で入力した単語を加え、次の空の行へ進む
  await head.fill("merci");
  await table.getByRole("textbox", { name: "意味" }).fill("ありがとう");
  await page.keyboard.press("ArrowDown");
  await expect(table.getByRole("cell", { name: "merci", exact: true })).toBeVisible();
  await expect(head).toHaveValue("");
  await expect(head).toBeFocused();

  // 何も入力していなければ、↓ を押しても単語は増えない
  await page.keyboard.press("ArrowDown");
  await expect(table.locator("tbody tr[data-card-index]")).toHaveCount(1);

  // 入力中に＋を押すと、入力した単語を加えて次の空の行へ
  await head.fill("bonjour");
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await expect(table.getByRole("cell", { name: "bonjour", exact: true })).toBeVisible();
  await expect(head).toHaveValue("");

  await table.getByRole("button", { name: "キャンセル" }).click();
  await expect(head).toHaveCount(0);
});
