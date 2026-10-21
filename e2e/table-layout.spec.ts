import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

async function createNotebookWithCards(
  page: Page,
  baseURL: string,
  title: string,
  cards: [string, string, string?][],
) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  // 3つ目の値があれば「例文」の列を足して入れる
  if (cards.some((card) => card[2] !== undefined)) {
    const added = await page.request.post(notebookUrl, {
      form: { intent: "addColumn", name: "例文" },
      headers: { Origin: baseURL },
    });
    expect(added.ok()).toBe(true);
  }
  for (const [head, meaning, example] of cards) {
    const created = await page.request.post(notebookUrl, {
      form: {
        intent: "createCard",
        head,
        "row:0:意味": meaning,
        ...(example !== undefined ? { "row:0:例文": example } : {}),
      },
      headers: { Origin: baseURL },
    });
    expect(created.ok()).toBe(true);
  }
  await page.reload();
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  return page.getByRole("table").first();
}

test("★の回数を修正する小さな窓は、表に隠れずに全部見える", async ({ page, baseURL }) => {
  // 単語が1件だけで表が低いと、表の外枠に窓の下側が隠れやすい
  await createNotebookWithCards(page, baseURL!, "e2e 用の★の回数の窓の単語帳", [
    ["merci", "ありがとう"],
  ]);
  await page.getByRole("button", { name: "★の回数を修正する" }).click();
  const panel = page.getByText("★の回数を修正").locator("xpath=..");
  await expect(panel).toBeVisible();

  // 窓の四隅の少し内側が、どれも窓自身（またはその中身）として見えている
  const hidden = await panel.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const points = [
      [r.left + 4, r.top + 4],
      [r.right - 4, r.top + 4],
      [r.left + 4, r.bottom - 4],
      [r.right - 4, r.bottom - 4],
    ];
    return points.filter(([x, y]) => !el.contains(document.elementFromPoint(x, y))).length;
  });
  expect(hidden).toBe(0);
  await expect(page.getByRole("button", { name: "0にリセット" })).toBeVisible();
});

test.describe("画面幅が狭いとき", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("単語の表は横スクロールせずに全体が見え、長い文字は折り返す", async ({ page, baseURL }) => {
    const longMeaning =
      "憲法に反するように、という意味の副詞で、フランス語でもっとも長い単語のひとつとして知られている";
    const table = await createNotebookWithCards(page, baseURL!, "e2e 用の狭い画面の表の単語帳", [
      ["merci", "ありがとう", "Merci !"],
      ["anticonstitutionnellement", longMeaning, "Il a agi anticonstitutionnellement."],
    ]);

    // 表を囲む枠が横にスクロールしない（表の幅が枠に収まっている）
    const frame = table.locator("xpath=..");
    const overflow = await frame.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    // 長い意味は折り返して複数行になり、短い言葉や列名は途中で折り返さずに1行のまま
    const lineCount = (text: string) =>
      table.getByRole("cell", { name: text, exact: true }).evaluate((cell) => {
        const lineHeight = parseFloat(getComputedStyle(cell).lineHeight);
        const range = document.createRange();
        // 見出し語のマスは下に★などの行があるため、見出し語の文字（最初の要素）だけを測る
        range.selectNodeContents(cell.firstElementChild ?? cell);
        return Math.round(range.getBoundingClientRect().height / lineHeight);
      });
    expect(await lineCount("ありがとう")).toBe(1);
    expect(await lineCount("merci")).toBe(1);
    expect(await lineCount(longMeaning)).toBeGreaterThan(1);
    const headerLines = await table
      .getByRole("columnheader", { name: "見出し語", exact: true })
      .evaluate((th) => {
        const range = document.createRange();
        range.selectNodeContents(th);
        return Math.round(
          range.getBoundingClientRect().height / parseFloat(getComputedStyle(th).lineHeight),
        );
      });
    expect(headerLines).toBe(1);
  });
});
