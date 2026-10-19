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

test("学習履歴の上に、左隣・右隣のページを左右の端に表示し、タップでも移動できる", async ({
  page,
}) => {
  await page.goto("/history");
  const hint = page.getByRole("navigation", { name: "ページの切り替え" });
  // 左端は左隣のMy単語帳（指を右へ動かすと移る）、右端は右隣の学習教材（指を左へ動かすと移る）
  const left = hint.getByRole("link", { name: /My単語帳/ });
  const right = hint.getByRole("link", { name: /学習教材/ });
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();

  // 画面の左端・右端に寄せて表示する
  const leftBox = (await left.boundingBox())!;
  const rightBox = (await right.boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(leftBox.x).toBeLessThan(24);
  expect(width - (rightBox.x + rightBox.width)).toBeLessThan(24);

  await right.tap();
  await expect(page).toHaveURL(/\/learn$/);
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

test("フリックで移ったあと、ヘッダーの下の ◀ ▶ も移った先のページのものに変わる", async ({
  page,
}) => {
  await page.goto("/history");
  const switcher = page.getByRole("navigation", { name: "ページの切り替え" });
  await expect(switcher).toHaveText("◀︎My単語帳学習教材▶︎");

  await flick(page, -150);
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-swipe");
  await expect(switcher).toHaveText("◀︎最近の学習履歴My単語帳▶︎");
});

test("フリックのアニメーション中も、ヘッダーの下の ◀ ▶ は移った先のページの名前へ切り替わっていく", async ({
  page,
}) => {
  await page.goto("/history");
  await flick(page, -150);
  // アニメーション中に動いている部分（::view-transition-new(...)）に ◀ ▶ の部分が含まれている
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.documentElement
          .getAnimations({ subtree: true })
          .map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement ?? "")
          .filter((name) => name.includes("vb-swipe-hint")),
      ),
    )
    .toContain("::view-transition-new(vb-swipe-hint)");
});
