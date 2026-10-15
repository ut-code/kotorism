import { expect, test } from "@playwright/test";

test.describe("学習教材", () => {
  test("言語の一覧から、各言語のセクション一覧に入れる", async ({ page }) => {
    await page.goto("/learn");
    await page
      .getByRole("link", { name: /中国語/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/learn\/chinese$/);
  });

  test("MDX で書かれたセクション(中国語 05)が描画される", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await expect(
      page.getByRole("heading", { level: 1, name: "助動詞の否定表現クイズ" }),
    ).toBeVisible();
  });

  test("TSX で書かれたセクション(フランス語 01)が描画される", async ({ page }) => {
    const response = await page.goto("/learn/french/01");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });
});
