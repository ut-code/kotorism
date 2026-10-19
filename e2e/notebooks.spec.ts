import { expect, test } from "@playwright/test";

import { createNotebook } from "./helpers";

test("「新しい単語帳」を押すとすぐ空の単語帳が開き、その場でタイトルを付けて表・Excelの取り込みを使える", async ({
  page,
}) => {
  await page.goto("/my-notebooks");
  // 一覧ではタイトルを入力しない
  await expect(page.getByRole("textbox", { name: "単語帳のタイトル" })).toHaveCount(0);
  await page.getByRole("button", { name: "新しい単語帳" }).click();
  await expect(page).toHaveURL(/\/my-notebooks\/[^/?]+/);

  // 開いた直後は、仮のタイトル（無題の単語帳）を選んだ状態で入力できる
  const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
  await expect(titleInput).toBeFocused();
  await expect(titleInput).toHaveValue("無題の単語帳");
  await page.keyboard.type("e2e 用の単語帳");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "e2e 用の単語帳" })).toBeVisible();

  // 同じページで、単語の追加と Excel の取り込みがすぐ使える
  await expect(page.getByRole("link", { name: "＋ 単語を追加" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Excel・スプレッドシートから追加" })).toBeVisible();

  // 再読み込みしてもタイトルの入力にはならず、一覧に作った単語帳が並ぶ
  await page.reload();
  await expect(page.getByRole("textbox", { name: "単語帳のタイトル" })).toHaveCount(0);
  await page.goto("/my-notebooks");
  await expect(page.getByText("e2e 用の単語帳")).toBeVisible();
});

test("単語帳のタイトルは、あとからタイトルを押して変えられる（Esc で取り消し）", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用のタイトルを変える単語帳");
  await page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }).click();
  const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
  await titleInput.fill("取り消すタイトル");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }),
  ).toBeVisible();

  await page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }).click();
  await titleInput.fill("変えたタイトル");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "変えたタイトル" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "変えたタイトル" })).toBeVisible();
});

test("他人の単語帳の共有URLは、存在しなければ 404", async ({ page }) => {
  const response = await page.goto("/share/does-not-exist");
  expect(response?.status()).toBe(404);
});

test.describe("単語帳の名前が自分の別の単語帳と重なったとき", () => {
  // 「重なり確認 …」という名前の単語帳を1つ作っておき、新しい単語帳に同じ名前を付けようとする
  async function tryDuplicate(page: import("@playwright/test").Page, name: string) {
    await createNotebook(page, name);
    await page.goto("/my-notebooks");
    await page.getByRole("button", { name: "新しい単語帳" }).click();
    const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
    await titleInput.fill(name);
    await titleInput.press("Enter");
    await expect(page.getByRole("alert")).toContainText(
      `「${name}」という名前の単語帳がすでにあります`,
    );
  }

  test("番号を付けた名前を選べる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 番号");
    await page.getByRole("button", { name: "「重なり確認 番号 1」にする" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "重なり確認 番号 1" })).toBeVisible();
  });

  test("今日の日付を付けた名前を選べる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 日付");
    await page
      .getByRole("button", { name: /^「重なり確認 日付 \d{4}-\d{2}-\d{2}」にする$/ })
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: /^重なり確認 日付 \d{4}-\d{2}-\d{2}$/ }),
    ).toBeVisible();
  });

  test("このままの名前にもできる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 このまま");
    await page.getByRole("button", { name: "このままにする" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "重なり確認 このまま" }),
    ).toBeVisible();
    await page.goto("/my-notebooks");
    await expect(page.getByText("重なり確認 このまま", { exact: true })).toHaveCount(2);
  });

  test("新しい単語帳を「無題の単語帳」のまま決めても、重なっていれば知らせる", async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await page.goto("/my-notebooks");
      await page.getByRole("button", { name: "新しい単語帳" }).click();
      await page.getByRole("textbox", { name: "単語帳のタイトル" }).press("Enter");
    }
    // 2つ目で知らせる（1つ目は、ほかに「無題の単語帳」が無ければそのまま決まる）
    await expect(page.getByRole("alert")).toContainText(
      "「無題の単語帳」という名前の単語帳がすでにあります",
    );
  });
});

test("Excel・スプレッドシートから追加では、Googleスプレッドシートを .xlsx で書き出して取り込む方法を案内する", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用のスプレッドシートの案内の単語帳");
  await page.getByRole("button", { name: "Excel・スプレッドシートから追加" }).click();
  await expect(
    page.getByText(
      "Googleスプレッドシートの場合は、「ファイル」→「ダウンロード」→「Microsoft Excel（.xlsx）」で保存したファイルを選んでください。",
    ),
  ).toBeVisible();
});
