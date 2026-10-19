import { expect, test } from "@playwright/test";

// My単語帳 ← 学習履歴 → 学習教材 の並び（両端はループ）。各ページの左端に左隣、右端に右隣のページを出す
const PAGES = [
  {
    path: "/my-notebooks",
    left: "学習教材",
    leftPath: "/learn",
    right: "最近の学習履歴",
    rightPath: "/history",
  },
  {
    path: "/history",
    left: "My単語帳",
    leftPath: "/my-notebooks",
    right: "学習教材",
    rightPath: "/learn",
  },
  {
    path: "/learn",
    left: "最近の学習履歴",
    leftPath: "/history",
    right: "My単語帳",
    rightPath: "/my-notebooks",
  },
];

for (const { path, left, leftPath, right, rightPath } of PAGES) {
  test(`PCでも ${path} のヘッダーの下に ◀ ${left}・${right} ▶ を出し、クリックで移動できる`, async ({
    page,
  }) => {
    await page.goto(path);
    const switcher = page.getByRole("navigation", { name: "ページの切り替え" });
    const leftLink = switcher.getByRole("link", { name: left, exact: true });
    const rightLink = switcher.getByRole("link", { name: right, exact: true });
    await expect(leftLink).toBeVisible();
    await expect(rightLink).toBeVisible();

    // 左のリンクは画面の左側、右のリンクは画面の右側に置く
    const width = page.viewportSize()!.width;
    expect((await leftLink.boundingBox())!.x).toBeLessThan(width / 2);
    expect((await rightLink.boundingBox())!.x).toBeGreaterThan(width / 2);

    await leftLink.click();
    await expect(page).toHaveURL(new RegExp(`${leftPath}$`));
    await page.goto(path);
    await page
      .getByRole("navigation", { name: "ページの切り替え" })
      .getByRole("link", { name: right, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${rightPath}$`));
  });
}

test("3ページ以外（単語帳の中・教材の中など）には出さない", async ({ page }) => {
  await page.goto("/learn/french/01");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "ページの切り替え" })).toHaveCount(0);
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

test("PCでは、左の ◀ はメニュー（サイドバー）の右側に置く（メニューを閉じても重ならない）", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/history");
  const left = page.getByRole("navigation", { name: "ページの切り替え" }).getByRole("link").first();
  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible();
  const sidebarRight = async (locator: typeof sidebar) => {
    const box = (await locator.boundingBox())!;
    return box.x + box.width;
  };
  expect((await left.boundingBox())!.x).toBeGreaterThanOrEqual(await sidebarRight(sidebar));

  // メニューを閉じたときは、閉じたメニュー（開くボタン）の右側
  await page.getByRole("button", { name: "サイドバーを閉じる" }).click();
  const collapsed = page.getByRole("button", { name: "サイドバーを開く" }).locator("xpath=..");
  await expect(collapsed).toBeVisible();
  expect((await left.boundingBox())!.x).toBeGreaterThanOrEqual(await sidebarRight(collapsed));
});

test("スマホでは、左の ◀ は画面の左端に置く", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/history");
  const left = page.getByRole("navigation", { name: "ページの切り替え" }).getByRole("link").first();
  expect((await left.boundingBox())!.x).toBeLessThan(24);
});
