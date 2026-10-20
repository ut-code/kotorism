import { expect, test } from "@playwright/test";

test.describe("動詞の活用", () => {
  test("「練習を始める」ボタンが設定より上にある", async ({ page }) => {
    await page.goto("/learn/french/03");
    const start = await page.getByRole("button", { name: "練習を始める" }).boundingBox();
    const verbs = await page.getByRole("heading", { name: /出題する動詞/ }).boundingBox();
    expect(start && verbs && start.y < verbs.y).toBe(true);
  });

  test("出題する動詞・時制は、開くまで選択肢を出さない", async ({ page }) => {
    await page.goto("/learn/french/03");
    await expect(page.getByRole("checkbox")).toHaveCount(0);

    // 「選ぶ」などの別ボタンではなく、項目の見出しそのものを押して開く
    await expect(page.getByRole("button", { name: /^(選ぶ|閉じる)$/ })).toHaveCount(0);
    const tenseToggle = page.getByRole("button", { name: /^出題する時制・法/ });
    await expect(tenseToggle).toHaveAttribute("aria-expanded", "false");
    await tenseToggle.click();
    await expect(tenseToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("checkbox", { name: "直説法 現在" })).toBeVisible();
    // 初学者向けに絞った時制だけを出す
    await expect(page.getByRole("checkbox", { name: "直説法 大過去" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "接続法 過去" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "条件法 過去" })).toHaveCount(0);

    await tenseToggle.click();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
  });

  test("初期設定は4択で出題し、筆記に切り替えられる", async ({ page }) => {
    await page.goto("/learn/french/03");
    await expect(page.getByRole("button", { name: /^答え方/ })).toContainText("4択");
    await page.getByRole("button", { name: "練習を始める" }).click();

    const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
    await expect(choices).toHaveCount(4);
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await choices.first().click();
    await expect(page.getByRole("status")).toContainText(/正解|不正解/);

    await page.getByRole("button", { name: "設定に戻る" }).click();
    await page.getByRole("button", { name: /^答え方/ }).click();
    await page.getByRole("radio", { name: "筆記" }).click();
    await page.getByRole("button", { name: "練習を始める" }).click();
    await expect(page.getByRole("textbox")).toBeVisible();
  });
});

// 初学者向けに、基本的な動詞だけを出題する
for (const language of ["french", "spanish", "german"]) {
  test(`${language}: 出題する動詞は基本的なものに絞る`, async ({ page }) => {
    await page.goto(`/learn/${language}/03`);
    const count = await page.getByText(/\d+ \/ \d+ 語を選択中/).textContent();
    const total = Number(/\/ (\d+)/.exec(count ?? "")?.[1]);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(40);
  });
}
