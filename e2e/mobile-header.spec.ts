import { devices, expect, test } from "@playwright/test";

// スマホ（タッチ操作・狭い画面）で開く。channel は playwright.config.ts の chrome を使う
const { defaultBrowserType: _, ...pixel } = devices["Pixel 7"];
test.use(pixel);

for (const path of ["/history", "/my-notebooks", "/learn"]) {
  test(`スマホでログイン中、${path} のヘッダーのボタンをタップできる`, async ({ page }) => {
    await page.goto(path);
    const header = page.getByRole("banner");

    await header.getByRole("button", { name: "メニューを開く" }).tap();
    await expect(page.locator("#header-mobile-menu")).toBeVisible();
    await header.getByRole("button", { name: "メニューを閉じる" }).tap();
    await expect(page.locator("#header-mobile-menu")).toBeHidden();

    const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));
    const before = await isDark();
    await header.getByRole("button", { name: /ライト\/ダーク/ }).tap();
    expect(await isDark()).toBe(!before);
  });
}

test("スマホでログイン中、メニューのリンクから移動できる", async ({ page }) => {
  await page.goto("/history");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "メニューを開く" }).tap();
  await header.getByRole("link", { name: "学習教材" }).tap();
  await expect(page).toHaveURL(/\/learn$/);
});

test("スマホでメニューを開いているとき、メニュー以外の場所を押すと閉じる", async ({ page }) => {
  await page.goto("/history");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "メニューを開く" }).tap();
  const menu = page.locator("#header-mobile-menu");
  await expect(menu).toBeVisible();

  // メニューの中を押しても閉じない
  await menu.tap({ position: { x: 4, y: 4 } });
  await expect(menu).toBeVisible();

  // メニューの外（画面の下のほう）を押すと閉じる
  const viewport = page.viewportSize()!;
  const menuBottom = (await menu.boundingBox())!.y + (await menu.boundingBox())!.height;
  expect(menuBottom).toBeLessThan(viewport.height - 40);
  await page.touchscreen.tap(viewport.width / 2, viewport.height - 20);
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/\/history$/);
});
