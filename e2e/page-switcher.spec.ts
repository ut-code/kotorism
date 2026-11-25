import { expect, test } from "@playwright/test";

// ログイン後の主な3つの場所（学習履歴・My単語帳・学習教材）の行き来。
// ヘッダーの下の「◀ ○○ / ○○ ▶」はパンくずリストに見えて紛らわしいので出さず、PCではサイドバーから移動する
// （スマホのフリック中だけ出す名前は swipe-navigation.spec.ts）
test("PCではヘッダーの下に ◀▶ を出さず、サイドバーの 学習履歴・My単語帳・学習教材 から移動できる", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/learn");
  await expect(page.getByText("◀︎", { exact: false })).toHaveCount(0);

  const sidebar = page.locator("aside");
  await sidebar.getByRole("link", { name: "学習履歴", exact: true }).click();
  await expect(page).toHaveURL(/\/history$/);
  await sidebar.getByRole("link", { name: "My単語帳", exact: true }).click();
  await expect(page).toHaveURL(/\/my-notebooks$/);
  await sidebar.getByRole("link", { name: "学習教材", exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
});

// フリック・◀▶で行き来したときに見出しが動いて見えないよう、3ページで見出しの大きさと位置を揃える
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`画面幅 ${viewport.width}px で、3ページの見出しの大きさと位置が揃っている`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const measure = async (path: string, name: string) => {
      await page.goto(path);
      const heading = page.getByRole("heading", { level: 1, name });
      await expect(heading).toBeVisible();
      return heading.evaluate((el) => {
        const text = document.createRange();
        text.selectNodeContents(el);
        const box = text.getBoundingClientRect();
        return {
          fontSize: getComputedStyle(el).fontSize,
          top: Math.round(box.top + window.scrollY),
          // 文字そのものの中心が、見出しの横幅の中心にあるか（中央揃え）
          centerOffset: Math.round(
            box.left + box.width / 2 - (el.getBoundingClientRect().left + el.clientWidth / 2),
          ),
        };
      });
    };
    const history = await measure("/history", "最近の学習履歴");
    const notebooks = await measure("/my-notebooks", "My単語帳");
    const learn = await measure("/learn", "学習教材");

    expect(history.centerOffset).toBe(0);
    expect(notebooks).toEqual(history);
    expect(learn).toEqual(history);
  });
}
