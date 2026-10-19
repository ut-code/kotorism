import { expect, test } from "@playwright/test";

// 発音チェックでは、自分で入力した中国語にもピンインを付けて表示する
test("発音チェックで自由に入力した中国語のピンインが表示される", async ({ page }) => {
  await page.goto("/learn/chinese/04");
  await page.getByRole("button", { name: "自由に入力する" }).click();
  await page.getByPlaceholder("例: 我想吃中国菜").fill("我想吃中国菜");

  await expect(page.getByText("wǒ xiǎng chī zhōng guó cài")).toBeVisible();
});
