import { expect, test } from "@playwright/test";

test("単語帳を作成すると、その単語帳のページへ移動する", async ({ page }) => {
  await page.goto("/my-notebooks");
  await page.getByLabel("単語帳のタイトル").fill("e2e 用の単語帳");
  await page.getByRole("button", { name: "単語帳を作成" }).click();

  await expect(page).toHaveURL(/\/my-notebooks\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "e2e 用の単語帳" })).toBeVisible();

  // 一覧に戻ると作成した単語帳が並ぶ
  await page.goto("/my-notebooks");
  await expect(page.getByText("e2e 用の単語帳")).toBeVisible();
});

test("他人の単語帳の共有URLは、存在しなければ 404", async ({ page }) => {
  const response = await page.goto("/share/does-not-exist");
  expect(response?.status()).toBe(404);
});
