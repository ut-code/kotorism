import { devices, expect, test } from "@playwright/test";

// スマホ（指で操作する端末）では、ピンイン入力のあいだ OS のキーボードの代わりにキーパッドを出す
test.describe("中国語のピンイン入力（スマホ）", () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test("キーパッドでピンインを打ち、声調を付けて漢字に変換できる", async ({ page }) => {
    await page.goto("/learn/chinese/01");
    await page.getByRole("button", { name: "書き始める" }).click();

    const essay = page.getByPlaceholder(/作文を書いてください/);
    await essay.tap();
    // OS のキーボードは出さない
    await expect(essay).toHaveAttribute("inputmode", "none");

    const keypad = page.getByRole("group", { name: "ピンイン入力キーパッド" });
    await expect(keypad).toBeVisible();
    for (const ch of "nihao") await keypad.getByRole("button", { name: ch, exact: true }).tap();
    await keypad.getByRole("button", { name: "最後の音節を第3声にする" }).tap();

    const candidates = page.getByRole("region", { name: "ピンイン変換候補" });
    await expect(candidates).toContainText("ni'hǎo");
    await candidates
      .getByRole("button", { name: /你好/ })
      .first()
      .tap();
    await keypad.getByRole("button", { name: "。" }).tap();

    await expect(essay).toHaveValue("你好。");
  });
});
