import { expect, test, type Locator, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// e2e は同じユーザーで並行して動くため、一覧にはほかのテストの単語帳も並ぶ。
// このテストで作った単語帳（prefix で始まる名前）どうしの並びだけを見る
async function ownOrder(page: Page, prefix: string) {
  const titles = await page
    .getByRole("list", { name: "作成済みの単語帳" })
    .getByRole("listitem")
    .evaluateAll((items) => items.map((item) => item.querySelector("p")?.textContent ?? ""));
  return titles.filter((title) => title.startsWith(prefix));
}

async function createThree(page: Page, prefix: string) {
  for (const name of ["A", "B", "C"]) await createNotebook(page, `${prefix} ${name}`);
  await page.goto("/my-notebooks");
  // 長押しは画面の準備（ハイドレーション）が済んでから受け付けるので、読み込みが落ち着くまで待つ
  await page.waitForLoadState("networkidle");
}

const item = (page: Page, title: string) =>
  page
    .getByRole("list", { name: "作成済みの単語帳" })
    .getByRole("listitem")
    .filter({ hasText: title });

test("お気に入りにした単語帳は一覧の一番上に並び、外すと元の並びに戻る", async ({ page }) => {
  const prefix = "一覧のお気に入り";
  await createThree(page, prefix);
  // 新しく作った順（C, B, A）に並ぶ
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} C`, `${prefix} B`, `${prefix} A`]);

  await item(page, `${prefix} A`).getByRole("button", { name: "お気に入りに追加" }).click();
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} A`, `${prefix} C`, `${prefix} B`]);
  // お気に入りは、ほかのテストの単語帳も含めて一覧の一番上
  await expect(
    page.getByRole("list", { name: "作成済みの単語帳" }).getByRole("listitem").first(),
  ).toContainText(`${prefix} A`);
  await page.reload();
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} A`, `${prefix} C`, `${prefix} B`]);

  await item(page, `${prefix} A`).getByRole("button", { name: "お気に入りから外す" }).click();
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} C`, `${prefix} B`, `${prefix} A`]);
});

// マウスで長押ししたまま、target の位置へ動かして離す
async function longPressDrag(page: Page, source: Locator, target: { x: number; y: number }) {
  // ♡ や削除のボタンの上では並べ替えないので、単語帳の名前（リンク）の上を長押しする
  const box = (await source.getByRole("link").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move(target.x, target.y, { steps: 10 });
  await page.mouse.up();
}

test("単語帳を長押ししたまま動かすと並べ替えられ、長押しのあとは単語帳を開かない", async ({
  page,
}) => {
  const prefix = "一覧の並べ替え";
  await createThree(page, prefix);
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} C`, `${prefix} B`, `${prefix} A`]);

  // A を C の上へ。ほかのテストの単語帳で一覧が長くなっていても A と C が画面に入るよう、真ん中の B を画面の中央へ
  await item(page, `${prefix} B`).evaluate((el) => el.scrollIntoView({ block: "center" }));
  const c = (await item(page, `${prefix} C`).boundingBox())!;
  await longPressDrag(page, item(page, `${prefix} A`), { x: c.x + 20, y: c.y + 4 });
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} A`, `${prefix} C`, `${prefix} B`]);
  await expect(page).toHaveURL(/\/my-notebooks$/);
  await page.reload();
  await expect
    .poll(() => ownOrder(page, prefix))
    .toEqual([`${prefix} A`, `${prefix} C`, `${prefix} B`]);

  // 普通に押せば、これまでどおり単語帳が開く
  await item(page, `${prefix} B`).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: `${prefix} B` })).toBeVisible();
});

test.describe("スマホ（タッチ操作）", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("単語帳を長押ししたまま動かすと並べ替えられる", async ({ page }) => {
    const prefix = "スマホの一覧の並べ替え";
    await createThree(page, prefix);
    await item(page, `${prefix} B`).evaluate((el) => el.scrollIntoView({ block: "center" }));
    // ♡ や削除のボタンの上では並べ替えないので、単語帳の名前（リンク）の上を長押しする
    const source = (await item(page, `${prefix} A`).getByRole("link").boundingBox())!;
    const target = (await item(page, `${prefix} C`).boundingBox())!;
    const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    await page.waitForTimeout(700);
    for (let i = 1; i <= 8; i++) {
      const y = start.y + ((target.y + 4 - start.y) * i) / 8;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: start.x, y }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect
      .poll(() => ownOrder(page, prefix))
      .toEqual([`${prefix} A`, `${prefix} C`, `${prefix} B`]);
    await expect(page).toHaveURL(/\/my-notebooks$/);
  });
});
