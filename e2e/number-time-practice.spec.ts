import { expect, test } from "@playwright/test";

const choices = (page: import("@playwright/test").Page) =>
  page.locator(".max-w-xl .flex.flex-col.gap-2 > button");

// スマホ幅かどうかは実際の画面で決まるので e2e に残す。PC の設定・出題はコンポーネントテストで確かめる
test.describe("数字・時間表現の演習（スマホ）", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("初期設定は4択で出題する", async ({ page }) => {
    await page.goto("/learn/french/08");
    await expect(page.getByRole("button", { name: /^答え方/ })).toContainText("4択");
    await expect(page.getByRole("button", { name: /^制限時間/ })).toContainText("15秒");
    await page.getByRole("button", { name: "練習を始める" }).click();
    await expect(choices(page)).toHaveCount(4);
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await choices(page).first().click();
    await expect(page.getByRole("status")).toContainText(/正解|不正解/);
  });
});
