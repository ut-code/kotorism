import { expect, test } from "@playwright/test";

// 文字の大きさは実際のレイアウトでしか測れないので e2e に残す。設定・出題の振る舞いはコンポーネントテストで確かめる
test("文法クイズ（紛らわしい表現）の例文の文字は大きすぎない（PC 幅で 24px 以下）", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/learn/french/07");
  await page.getByRole("button", { name: "練習を始める" }).click();
  const sentence = page.locator(".max-w-xl p[lang]").first();
  const fontSize = await sentence.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeLessThanOrEqual(24);
});
