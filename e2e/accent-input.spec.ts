import { expect, test } from "@playwright/test";

test.describe("作文・翻訳の特殊文字の入力補助", () => {
  test("フランス語の作文で、↑キーとボタンからアクセント記号付きの文字を入力できる", async ({
    page,
  }) => {
    await page.goto("/learn/french/01");
    await page.getByRole("button", { name: "書き始める" }).click();

    const textarea = page.getByPlaceholder(/フランス語で作文/);
    await textarea.pressSequentially("Je");
    await textarea.press("ArrowUp");
    await expect(textarea).toHaveValue("Jé");

    await textarea.press("End");
    await page.getByRole("group", { name: "特殊文字" }).getByRole("button", { name: "ç" }).click();
    await expect(textarea).toHaveValue("Jéç");
  });

  test("文字を入力した直後でなければ、↑キーは普段どおり行を移動する", async ({ page }) => {
    await page.goto("/learn/french/01");
    await page.getByRole("button", { name: "書き始める" }).click();

    const textarea = page.getByPlaceholder(/フランス語で作文/);
    await textarea.pressSequentially("e");
    await textarea.press("Enter");
    await textarea.press("ArrowUp");
    await expect(textarea).toHaveValue("e\n");
  });

  test("スペイン語の翻訳（日本語 → スペイン語）で、↑キーで ñ を入力できる", async ({ page }) => {
    await page.goto("/learn/spanish/02");
    await page.getByRole("button", { name: "訳し始める" }).click();

    const textarea = page.getByPlaceholder(/スペイン語で訳文/);
    await textarea.pressSequentially("n");
    await textarea.press("ArrowUp");
    await expect(textarea).toHaveValue("ñ");
  });

  test("中国語の作文には特殊文字のボタンを出さない", async ({ page }) => {
    await page.goto("/learn/chinese/01");
    await page.getByRole("button", { name: "書き始める" }).click();

    await expect(page.getByPlaceholder(/中国語で作文/)).toBeVisible();
    await expect(page.getByRole("group", { name: "特殊文字" })).toHaveCount(0);
  });
});
