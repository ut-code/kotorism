import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

const WORDS = [
  ["cat", "猫"],
  ["dog", "犬"],
  ["house", "家"],
];

async function createWordNotebook(page: Page, baseURL: string, title: string) {
  const notebookUrl = await createNotebook(page, title);
  for (const [head, meaning] of WORDS) {
    const res = await page.request.post(notebookUrl, {
      form: { intent: "createCard", head, "row:0:意味": meaning },
      headers: { Origin: baseURL },
    });
    expect(res.ok()).toBe(true);
  }
  return notebookUrl;
}

async function currentWord(page: Page) {
  const head = (await page.locator("[data-quiz-head]").textContent())!.trim();
  return WORDS.find(([h]) => h === head)!;
}

test("クイズで答えたあと、「次の問題へ」の横の★で単語に★をつけ、★つきの単語だけを出題できる", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createWordNotebook(page, baseURL!, "e2e 用の★つきクイズ");
  await page.goto(`${notebookUrl}/quiz`);

  // ★のついた単語が無いうちは、★つきだけを選べない
  await expect(page.getByRole("button", { name: /★つきのみ/ })).toBeDisabled();

  await page.getByRole("button", { name: "全問", exact: true }).click();
  await page.getByRole("button", { name: "クイズを始める" }).click();

  // 答える前は★のボタンを出さない
  await expect(page.getByRole("button", { name: "★をつける" })).toHaveCount(0);

  const [head, meaning] = await currentWord(page);
  await page.getByRole("button", { name: meaning, exact: true }).click();
  await expect(page.getByText("正解！")).toBeVisible();

  const star = page.getByRole("button", { name: "★をつける" });
  await star.click();
  await expect(page.getByRole("button", { name: "★を外す" })).toBeVisible();

  // ★はサーバーに保存され、開き直しても★つきの単語として出題できる
  await expect
    .poll(async () => {
      await page.goto(`${notebookUrl}/quiz`);
      return page.getByRole("button", { name: /★つきのみ/ }).textContent();
    })
    .toContain("1語");

  await page.getByRole("button", { name: /★つきのみ/ }).click();
  await page.getByRole("button", { name: "全問", exact: true }).click();
  await page.getByRole("button", { name: "クイズを始める" }).click();
  await expect(page.getByText("1 / 1問目")).toBeVisible();
  await expect(page.locator("[data-quiz-head]")).toHaveText(head);

  // ★を外すと、★つきのみは選べなくなる
  await page.getByRole("button", { name: meaning, exact: true }).click();
  await page.getByRole("button", { name: "★を外す" }).click();
  await expect(page.getByRole("button", { name: "★をつける" })).toBeVisible();
  await page.getByRole("button", { name: "結果を見る" }).click();
  await page.getByRole("button", { name: "設定に戻る" }).click();
  await expect(page.getByRole("button", { name: /★つきのみ/ })).toBeDisabled();
});
