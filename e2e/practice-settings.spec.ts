import { expect, test, type Page } from "@playwright/test";

// どの演習も、開始ボタンを設定の一番上に置き、設定項目は見出しを押したときだけ選択肢を出す
const PRACTICES: {
  name: string;
  path: string;
  start: string | null;
  before?: (page: Page) => Promise<void>;
}[] = [
  { name: "動詞の活用", path: "/learn/french/03", start: "練習を始める" },
  { name: "穴埋め", path: "/learn/french/05", start: "練習を始める" },
  { name: "数字タイピング", path: "/learn/french/06", start: "練習を始める" },
  { name: "ピンイン", path: "/learn/chinese/03", start: "練習を始める" },
  { name: "中国語の文法クイズ", path: "/learn/chinese/05", start: "練習を始める" },
  { name: "表完成", path: "/learn/french/04", start: null },
  { name: "作文", path: "/learn/french/01", start: "書き始める" },
  { name: "翻訳", path: "/learn/spanish/02", start: "訳し始める" },
  {
    name: "簡体字クイズ",
    path: "/learn/chinese/06",
    start: "クイズを始める",
    before: async (page) => {
      await page
        .getByRole("group", { name: "練習の方法" })
        .getByRole("button", { name: /選択クイズ/ })
        .click();
    },
  },
];

for (const { name, path, start, before } of PRACTICES) {
  test(`${name}: 開始ボタンが設定より上にあり、設定は見出しを押すまで開かない`, async ({
    page,
  }) => {
    await page.goto(path);
    await before?.(page);

    const toggles = page.locator("main h3 button[aria-expanded]");
    await expect(toggles.first()).toBeVisible();
    for (const toggle of await toggles.all()) {
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
    // 開く前は選択肢を出さない
    await expect(page.locator("main").getByRole("radio")).toHaveCount(0);
    await expect(page.locator("main").getByRole("checkbox")).toHaveCount(0);
    await expect(page.locator("main").getByRole("combobox")).toHaveCount(0);

    if (start) {
      const startBox = await page.getByRole("button", { name: start }).boundingBox();
      const firstToggle = await toggles.first().boundingBox();
      expect(startBox && firstToggle && startBox.y < firstToggle.y).toBe(true);
    }

    // 見出しを押すと開き、もう一度押すと閉じる
    const first = toggles.first();
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "false");
  });
}
