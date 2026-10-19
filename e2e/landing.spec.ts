import { expect, test } from "@playwright/test";

// トップページ（LP）は未ログインの人向け。ログイン中は /history へ移るため、未ログインで開く
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  // スプラッシュ画面は表示済みにして、ボタンの操作を邪魔しないようにする
  await page.addInitScript(() => sessionStorage.setItem("vb-splash-seen", "1"));
  await page.goto("/");
});

test("「新規登録する」で新規登録の画面へ移る", async ({ page }) => {
  await page.getByRole("main").getByRole("link", { name: "新規登録する" }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("「ログインする」でログインの画面へ移る", async ({ page }) => {
  await page.getByRole("main").getByRole("link", { name: "ログインする" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("My単語帳・学習教材の大きなカードは、押してもページを移らない", async ({ page }) => {
  for (const name of ["My単語帳", "学習教材"]) {
    const heading = page.getByRole("heading", { level: 2, name });
    const card = heading.locator("xpath=ancestor::div[contains(@class, 'rounded-3xl')][1]");
    // 見出し・カードの余白（左上の角の近く）を押す
    await heading.click();
    await card.click({ position: { x: 12, y: 12 } });
    await expect(page).toHaveURL(/\/$/);
  }
  await expect(
    page.getByRole("link", { name: /My単語帳を使ってみる|学習教材をみてみる/ }),
  ).toHaveCount(0);
});
