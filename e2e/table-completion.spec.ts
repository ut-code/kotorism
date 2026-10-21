import { expect, test } from "@playwright/test";

// 表完成の見出し（「3人称単数男性」「男性単数」など）が語の途中で折り返すと読みにくいため、スマホ幅でも1行に収める
for (const language of ["german", "french", "spanish"]) {
  test(`表完成（${language}）: スマホ幅でも表の見出しが途中で折り返さない`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/learn/${language}/04`);
    const labels = page.locator("main table th > span");
    await expect(labels.first()).toBeVisible();

    const wrapped = await labels.evaluateAll((spans) =>
      spans
        .filter((span) => {
          const lineHeight = Number.parseFloat(getComputedStyle(span).lineHeight);
          return span.getBoundingClientRect().height > lineHeight * 1.5;
        })
        .map((span) => span.textContent),
    );
    expect(wrapped).toEqual([]);
  });
}
