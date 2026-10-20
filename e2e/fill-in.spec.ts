import { expect, test } from "@playwright/test";

test.describe("文法クイズ（紛らわしい表現）", () => {
  for (const { language, section } of [
    { language: "french", section: "07" },
    { language: "spanish", section: "06" },
  ]) {
    test(`${language}: 初期設定は4択で出題し、筆記に切り替えられる`, async ({ page }) => {
      await page.goto(`/learn/${language}/${section}`);
      await expect(
        page.getByRole("heading", { level: 1, name: "文法クイズ（紛らわしい表現）" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /^答え方/ })).toContainText("4択");
      await page.getByRole("button", { name: "練習を始める" }).click();

      const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
      await expect(choices).toHaveCount(4);
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await choices.first().click();
      await expect(page.getByRole("status")).toContainText(/正解|不正解/);

      await page.getByRole("button", { name: "設定に戻る" }).click();
      await page.getByRole("button", { name: /^答え方/ }).click();
      await page.getByRole("radio", { name: "筆記" }).click();
      await page.getByRole("button", { name: "練習を始める" }).click();
      await expect(page.getByRole("textbox")).toBeVisible();
    });
  }

  test("「練習を始める」ボタンが設定より上にある", async ({ page }) => {
    await page.goto("/learn/french/07");
    const start = await page.getByRole("button", { name: "練習を始める" }).boundingBox();
    const scope = await page.getByRole("heading", { name: /出題範囲/ }).boundingBox();
    expect(start && scope && start.y < scope.y).toBe(true);
  });

  test("出題範囲は、見出しを押すまで選択肢を出さない", async ({ page }) => {
    await page.goto("/learn/french/07");
    const scope = page.getByRole("radiogroup", { name: "出題範囲" });
    await expect(scope).toHaveCount(0);

    const toggle = page.getByRole("button", { name: /^出題範囲/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toContainText("すべて");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await scope.getByRole("radio", { name: /c'est/ }).click();
    // 閉じても、今の選択が見出しに出る
    await toggle.click();
    await expect(scope).toHaveCount(0);
    await expect(toggle).toContainText("c'est");
  });

  test("例文の文字は大きすぎない（PC 幅で 24px 以下）", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/learn/french/07");
    await page.getByRole("button", { name: "練習を始める" }).click();
    const sentence = page.locator(".max-w-xl p[lang]").first();
    const fontSize = await sentence.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeLessThanOrEqual(24);
  });
});
