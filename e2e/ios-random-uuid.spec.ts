import { devices, expect, test } from "@playwright/test";

// スマホ（タッチ操作・狭い画面）で開く。channel は playwright.config.ts の chrome を使う
const { defaultBrowserType: _, ...pixel } = devices["Pixel 7"];
test.use(pixel);

test("crypto.randomUUID が無いブラウザでも、学習教材のページが表示されヘッダーのボタンが動く", async ({
  page,
}) => {
  // http://<IP> で開いたときや iOS 15.3 以前の Safari を再現する
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined });
  });
  await page.goto("/learn/french/01");
  await expect(page.getByText("エラーが発生しました")).toBeHidden();
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "メニューを開く" }).tap();
  await expect(page.locator("#header-mobile-menu")).toBeVisible();
});
