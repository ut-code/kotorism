import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("画面幅が狭いとき、過去12ヶ月の学習状況は今月（右端）が見える位置から表示する", async ({
  page,
}) => {
  await page.goto("/history");
  const heatmap = page.getByRole("heading", { name: "過去12ヶ月の学習状況" }).locator("xpath=..");
  await expect(heatmap).toBeVisible();
  // Webフォントの読み込みで月の見出しの幅が変わると右端もずれるため、読み込み後の位置を確かめる
  await page.evaluate(() => document.fonts.ready);
  const measure = () =>
    heatmap.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      maxScrollLeft: el.scrollWidth - el.clientWidth,
    }));
  // 狭い画面では横スクロールになっている
  expect((await measure()).maxScrollLeft).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const { scrollLeft, maxScrollLeft } = await measure();
      return scrollLeft >= maxScrollLeft - 1;
    })
    .toBe(true);
});
