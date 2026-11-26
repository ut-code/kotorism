import { expect, test, type Page } from "@playwright/test";

// スマホ相当の画面幅・タッチ操作ができる端末として開く
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

// 画面中央から横に指を滑らせる。dx が正なら右フリック、負なら左フリック
async function flick(page: Page, dx: number) {
  await page.evaluate((dx) => {
    const x = window.innerWidth / 2 - dx / 2;
    const y = window.innerHeight / 2;
    const target = document.elementFromPoint(x, y)!;
    const touch = (clientX: number) => new Touch({ identifier: 1, target, clientX, clientY: y });
    target.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: [touch(x)],
        changedTouches: [touch(x)],
      }),
    );
    target.dispatchEvent(
      new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(x + dx)] }),
    );
  }, dx);
}

test("学習履歴で指を左へ動かすと右隣の学習教材、右へ動かすと左隣のMy単語帳へ移る", async ({
  page,
}) => {
  await page.goto("/history");
  await flick(page, -150);
  await expect(page).toHaveURL(/\/learn$/);

  await page.goto("/history");
  await flick(page, 150);
  await expect(page).toHaveURL(/\/my-notebooks$/);
});

test("3画面はループして行き来できる", async ({ page }) => {
  await page.goto("/learn");
  // スライドのアニメーション中は画面が覆われてフリックを受け付けないため、終わってから次のフリックをする
  const animationDone = () => expect(page.locator("html")).not.toHaveAttribute("data-swipe");
  // 指を左へ動かし続けると、右隣へ 学習教材 → My単語帳 → 学習履歴 → 学習教材 と一周する
  await flick(page, -150);
  await expect(page).toHaveURL(/\/my-notebooks$/);
  await animationDone();
  await flick(page, -150);
  await expect(page).toHaveURL(/\/history$/);
  await animationDone();
  await flick(page, -150);
  await expect(page).toHaveURL(/\/learn$/);
});

test("短い指の動きはフリックとみなさず、ページを移らない", async ({ page }) => {
  await page.goto("/history");
  await flick(page, 20);
  await expect(page).toHaveURL(/\/history$/);
});

// 指を画面中央から横に dx だけ動かしたまま止める（離さない）。離すときは release を呼ぶ
async function dragWithoutRelease(page: Page, dx: number) {
  await page.evaluate((dx) => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const target = document.elementFromPoint(x, y)!;
    (window as unknown as { dragTarget: Element }).dragTarget = target;
    const touch = (clientX: number) => new Touch({ identifier: 1, target, clientX, clientY: y });
    target.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: [touch(x)],
        changedTouches: [touch(x)],
      }),
    );
    target.dispatchEvent(
      new TouchEvent("touchmove", {
        bubbles: true,
        touches: [touch(x + dx)],
        changedTouches: [touch(x + dx)],
      }),
    );
  }, dx);
}

test("指を横に動かしている間だけ、画面の左右の端に隣のページの名前を出す", async ({ page }) => {
  await page.goto("/history");
  const labels = page.getByTestId("swipe-edge-labels");
  // ふだんは出さない（パンくずリストに見えないように）
  await expect(labels).toHaveCount(0);

  await dragWithoutRelease(page, -80);
  // 名前は画面の左右の端に固定して出す（外側の要素自体は大きさを持たない）
  await expect(labels.getByText("My単語帳")).toBeVisible();
  await expect(labels.getByText("学習教材")).toBeVisible();

  // 指を離す（中断する）と消える
  await page.evaluate(() => {
    const target = (window as unknown as { dragTarget: Element }).dragTarget;
    target.dispatchEvent(new TouchEvent("touchcancel", { bubbles: true }));
  });
  await expect(labels).toHaveCount(0);
  await expect(page).toHaveURL(/\/history$/);
});

test("フリックで右隣へ移るときは、ページを右から左へスライドさせる", async ({ page }) => {
  await page.goto("/history");
  // フリック中に <html data-swipe> に付いた値を記録する（どちらの隣へ移るかを CSS に伝える印）
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { swipeSeen: string[] }).swipeSeen = seen;
    new MutationObserver(() => {
      const value = document.documentElement.dataset.swipe;
      if (value) seen.push(value);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-swipe"] });
  });
  await flick(page, -150);
  await expect(page).toHaveURL(/\/learn$/);
  expect(
    await page.evaluate(() => (window as unknown as { swipeSeen: string[] }).swipeSeen),
  ).toEqual(["right"]);
  // アニメーションが終わったら印を外す（ほかの移動ではスライドさせない）
  await expect(page.locator("html")).not.toHaveAttribute("data-swipe");
});
