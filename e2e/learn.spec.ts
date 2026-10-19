import { expect, test } from "@playwright/test";

test.describe("学習教材", () => {
  test("言語の一覧から、各言語のセクション一覧に入れる", async ({ page }) => {
    await page.goto("/learn");
    await page
      .getByRole("link", { name: /中国語/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/learn\/chinese$/);
  });

  test("MDX で書かれたセクション(中国語 05)が描画される", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await expect(
      page.getByRole("heading", { level: 1, name: "助動詞の否定表現クイズ" }),
    ).toBeVisible();
  });

  test("助動詞クイズは4択と穴埋めを混ぜて出題し、どの問題にも解説が出る", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await page.getByRole("radio", { name: "全問" }).click();
    await page.getByRole("button", { name: "練習を始める" }).click();

    const kinds = new Set<string>();
    for (;;) {
      const input = page.getByPlaceholder("例: 不用 / buyong");
      if (await input.isVisible()) {
        kinds.add("fill");
        await input.fill("×");
        await page.getByRole("button", { name: "答え合わせ" }).click();
      } else {
        kinds.add("choice");
        await page.getByRole("button", { name: /^1/ }).click();
      }
      await expect(page.getByRole("status")).toContainText("解説:");

      const next = page.getByRole("button", { name: /次の問題へ|結果を見る/ });
      const isLast = (await next.textContent()) === "結果を見る";
      await next.click();
      if (isLast) break;
    }
    expect(kinds).toEqual(new Set(["choice", "fill"]));
  });

  test("TSX で書かれたセクション(フランス語 01)が描画される", async ({ page }) => {
    const response = await page.goto("/learn/french/01");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });
});
