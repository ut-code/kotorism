import { devices, expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// 補助で書き換えたあとに続けて打つ流れは、実ブラウザのキー入力でしか正しく確かめられないので e2e に残す。
// それ以外の入力補助は app/routes/my-notebooks.$notebookId._index/input-assist.test.tsx で確かめる
async function chooseLanguage(page: Page, label: string) {
  await page.getByRole("combobox", { name: "入力補助の言語" }).selectOption({ label });
  // 保存が終わるまで待つ（再読み込みしても選んだ言語のまま）
  await expect(page.getByRole("combobox", { name: "入力補助の言語" })).toBeEnabled();
}

test("フランス語の単語帳では、↑ やボタンでアクセント記号付きの文字を入力でき、列ごとに補助を外せる", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用のフランス語の単語帳");
  await chooseLanguage(page, "フランス語");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "入力補助の言語" })).toHaveValue("french");
  const table = page.getByRole("table").first();

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const head = table.getByRole("textbox", { name: "見出し語" });
  await page.keyboard.type("cafe");
  await page.keyboard.press("ArrowUp");
  await expect(head).toHaveValue("café");
  await expect(head).toHaveAttribute("lang", "fr");

  // ボタンで、入力中の欄のカーソルの位置に入れる
  const assist = page.getByRole("toolbar", { name: "入力補助" });
  await assist.getByRole("button", { name: "ç", exact: true }).click();
  await expect(head).toHaveValue("caféç");
  await expect(head).toBeFocused();
  await page.keyboard.press("Backspace");

  // 意味の列の補助を外すと、↑ で文字は変わらない（補助を外したことは再読み込みしても残る）
  const meaning = table.getByRole("textbox", { name: "意味" });
  await meaning.click();
  await assist.getByRole("radio", { name: "補助なし" }).click();
  await expect(meaning).toBeFocused();
  await page.keyboard.type("cafe");
  await page.keyboard.press("ArrowUp");
  await expect(meaning).toHaveValue("cafe");

  // 変換を終えた Enter は、今まで通り単語を追加する
  await page.keyboard.press("Enter");
  await expect(table.getByRole("cell", { name: "café", exact: true })).toBeVisible();

  await page.reload();
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await table.getByRole("textbox", { name: "意味" }).click();
  await expect(assist.getByRole("radio", { name: "補助なし" })).toBeChecked();
});

test("中国語の単語帳では、見出し語はピンインから簡体字に変換し、ピンインの列は声調記号を付けて入力できる", async ({
  page,
  baseURL,
}) => {
  await createNotebook(page, "e2e 用の中国語の単語帳");
  const added = await page.request.post(new URL(page.url()).pathname, {
    form: { intent: "addColumn", name: "拼音" },
    headers: { Origin: baseURL! },
  });
  expect(added.ok()).toBe(true);
  await page.reload();
  await chooseLanguage(page, "中国語");
  const table = page.getByRole("table").first();
  const assist = page.getByRole("toolbar", { name: "入力補助" });

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const head = table.getByRole("textbox", { name: "見出し語" });
  await page.keyboard.type("nihao");
  const candidates = page.getByRole("region", { name: "ピンイン変換候補" });
  await expect(candidates).toContainText("ni'hao");
  await expect(head).toHaveValue("");
  // 変換中の Enter は候補の確定で、単語の追加はしない
  await page.keyboard.press("Enter");
  await expect(head).toHaveValue("你好");
  await expect(candidates).toHaveCount(0);
  await expect(assist.getByRole("radio", { name: "簡体字" })).toBeChecked();

  const pinyin = table.getByRole("textbox", { name: "拼音" });
  await pinyin.click();
  await expect(assist.getByRole("radio", { name: "ピンイン" })).toBeChecked();
  await page.keyboard.type("ni");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.type("ha");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.type("o");
  await expect(pinyin).toHaveValue("nǐhǎo");

  // 見出し語の列もピンインのまま入力するように切り替えられる
  await head.click();
  await assist.getByRole("radio", { name: "ピンイン" }).click();
  await page.keyboard.press("End");
  await page.keyboard.type("a");
  await page.keyboard.press("ArrowUp");
  await expect(head).toHaveValue("你好ā");
  await expect(candidates).toHaveCount(0);

  await page.keyboard.press("Enter");
  await expect(table.getByRole("cell", { name: "你好ā", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "nǐhǎo", exact: true })).toBeVisible();
});

test.describe("中国語の単語帳（スマホ）", () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test("簡体字の欄では、OS のキーボードの代わりにキーパッドでピンインを打って変換できる", async ({
    page,
  }) => {
    await createNotebook(page, "e2e 用の中国語の単語帳（スマホ）");
    await chooseLanguage(page, "中国語");
    const table = page.getByRole("table").first();
    await table.getByRole("button", { name: "表に単語を追加" }).tap();
    const head = table.getByRole("textbox", { name: "見出し語" });
    await expect(head).toHaveAttribute("inputmode", "none");

    const keypad = page.getByRole("group", { name: "ピンイン入力キーパッド" });
    for (const ch of "nihao") await keypad.getByRole("button", { name: ch, exact: true }).tap();
    await page
      .getByRole("region", { name: "ピンイン変換候補" })
      .getByRole("button", { name: /你好/ })
      .first()
      .tap();
    await expect(head).toHaveValue("你好");

    // 意味の列（補助なし）では、キーパッドを出さずに OS のキーボードで入力する
    await table.getByRole("textbox", { name: "意味" }).tap();
    await expect(keypad).toHaveCount(0);
    await expect(table.getByRole("textbox", { name: "意味" })).not.toHaveAttribute("inputmode");
  });
});
