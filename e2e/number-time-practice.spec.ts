import { expect, test } from "@playwright/test";

const PAGES = [
  { language: "french", section: "08" },
  { language: "german", section: "07" },
  { language: "spanish", section: "07" },
];

const choices = (page: import("@playwright/test").Page) =>
  page.locator(".max-w-xl .flex.flex-col.gap-2 > button");

test.describe("数字・時間表現の演習（PC）", () => {
  for (const { language, section } of PAGES) {
    test(`${language}: 初期設定は筆記で、時刻を出題でき、4択に切り替えられる`, async ({ page }) => {
      await page.goto(`/learn/${language}/${section}`);
      await expect(
        page.getByRole("heading", { level: 1, name: "数字・時間表現の演習" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /^答え方/ })).toContainText("筆記");
      // 入力には時間がかかるので、筆記の制限時間の初期値は30秒
      await expect(page.getByRole("button", { name: /^制限時間/ })).toContainText("30秒");

      await page.getByRole("button", { name: /^出題範囲/ }).click();
      await page.getByRole("radio", { name: "時刻" }).click();
      await page.getByRole("button", { name: "練習を始める" }).click();
      await expect(page.locator(".max-w-xl .text-6xl")).toHaveText(/^\d{1,2}:\d{2}$/);
      await expect(page.getByRole("textbox")).toBeVisible();

      await page.getByRole("button", { name: "設定に戻る" }).click();
      await page.getByRole("button", { name: /^答え方/ }).click();
      await page.getByRole("radio", { name: "4択" }).click();
      await expect(page.getByRole("button", { name: /^制限時間/ })).toContainText("15秒");
      await page.getByRole("button", { name: "練習を始める" }).click();
      await expect(choices(page)).toHaveCount(4);
      await expect(page.getByRole("textbox")).toHaveCount(0);
    });
  }
});

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
