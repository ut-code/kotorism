import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("画面幅が狭いとき、過去12ヶ月の学習状況は今月（右端）が見える位置から表示する", async ({
  page,
}) => {
  await page.goto("/history");
  const heatmap = page.getByRole("heading", { name: "過去12ヶ月の学習状況" }).locator("xpath=..");
  await expect(heatmap).toBeVisible();
  // 狭い画面では横スクロールになっている
  const { scrollLeft, maxScrollLeft } = await heatmap.evaluate((el) => ({
    scrollLeft: el.scrollLeft,
    maxScrollLeft: el.scrollWidth - el.clientWidth,
  }));
  expect(maxScrollLeft).toBeGreaterThan(0);
  expect(scrollLeft).toBeGreaterThanOrEqual(maxScrollLeft - 1);
});
