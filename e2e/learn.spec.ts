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

  test("言語ごとの一覧から、言語一覧に戻れる", async ({ page }) => {
    await page.goto("/learn/french");
    await page.getByRole("link", { name: "言語一覧に戻る" }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("各教材のページから、その言語の学習教材一覧に戻れる", async ({ page }) => {
    await page.goto("/learn/french/01");
    await page.getByRole("link", { name: "学習教材一覧に戻る" }).click();
    await expect(page).toHaveURL(/\/learn\/french$/);
  });

  test("MDX で書かれたセクション(中国語 05)が描画される", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await expect(
      page.getByRole("heading", { level: 1, name: "文法クイズ", exact: true }),
    ).toBeVisible();
  });

  test("文法クイズの「出題する単元」は、チェックマークのない同じ高さの丸いチップで並ぶ", async ({
    page,
  }) => {
    await page.goto("/learn/french/05");
    await page.getByRole("button", { name: /^出題する単元/ }).click();
    const chips = page.locator("main").getByRole("checkbox");
    await expect(chips.first()).toBeVisible();
    const shapes = await chips.evaluateAll((elements) =>
      elements.map((chip) => ({
        height: Math.round(chip.getBoundingClientRect().height),
        round:
          parseFloat(getComputedStyle(chip).borderRadius) >=
          chip.getBoundingClientRect().height / 2,
        hasMark: chip.querySelector("input, svg") !== null,
      })),
    );
    expect(shapes.length).toBeGreaterThan(5);
    expect(new Set(shapes.map((s) => s.height)).size).toBe(1);
    expect(shapes.every((s) => s.round && !s.hasMark)).toBe(true);

    // チップを押すと選択を切り替えられる
    const negation = page.getByRole("checkbox", { name: /否定表現/ });
    await negation.uncheck();
    await expect(negation).not.toBeChecked();
    await negation.check();
    await expect(negation).toBeChecked();
  });

  test("TSX で書かれたセクション(フランス語 01)が描画される", async ({ page }) => {
    const response = await page.goto("/learn/french/01");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });
});
