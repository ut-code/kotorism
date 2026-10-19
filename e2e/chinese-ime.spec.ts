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

// PC ではキーボードで打ち、Enter で漢字を確定し、Tab で候補を移動する
test.describe("中国語のピンイン入力（PC）", () => {
  test("声調に合う候補が先頭に来て、Enter で漢字・Tab で候補移動・Shift+Enter でピンインのまま確定できる", async ({
    page,
  }) => {
    await page.goto("/learn/chinese/01");
    await page.getByRole("button", { name: "書き始める" }).click();

    const essay = page.getByPlaceholder(/作文を書いてください/);
    await essay.click();
    const candidates = page.getByRole("region", { name: "ピンイン変換候補" });
    const candidateButtons = candidates.getByRole("button");

    // mai → ↑ で第4声（mài）にすると、卖（売る）が先頭に来て Enter で確定される
    await page.keyboard.type("mai");
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowUp");
    await expect(candidates).toContainText("mài");
    await expect(candidateButtons.first()).toContainText("卖");
    await page.keyboard.press("Enter");
    await expect(essay).toHaveValue("卖");

    // Tab で 2 番目の候補に移り、Enter でその候補を確定する
    await page.keyboard.type("ma");
    const second = (await candidateButtons.nth(1).innerText()).replace(/^\d+\.\s*/, "").trim();
    await page.keyboard.press("Tab");
    await expect(essay).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(essay).toHaveValue(`卖${second}`);

    // Shift+Enter ではピンインのまま確定する
    await page.keyboard.type("nihao");
    await page.keyboard.press("Shift+Enter");
    await expect(essay).toHaveValue(`卖${second}nihao`);
  });
});
