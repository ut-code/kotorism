import { expect, type Page } from "@playwright/test";

// 一覧の「新しい単語帳」で空の単語帳を作り、開いたページでタイトルを付ける。単語帳のページのパスを返す
export async function createNotebook(page: Page, title: string): Promise<string> {
  await page.goto("/my-notebooks");
  await page.getByRole("button", { name: "新しい単語帳" }).click();
  await expect(page).toHaveURL(/\/my-notebooks\/[^/?]+/);
  const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
  await titleInput.fill(title);
  await titleInput.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  return new URL(page.url()).pathname;
}
