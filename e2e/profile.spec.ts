import { expect, test } from "@playwright/test";

import { signUpWithPassword } from "./auth-helpers";

// e2e ユーザーの名前は共有の表示のテストで使うので、名前を変えるのは専用のユーザーにする
test.use({ storageState: { cookies: [], origins: [] } });

test("ヘッダーで名前を変えると保存され、読み込み直しても新しい名前が出る", async ({ page }) => {
  await signUpWithPassword(page.request, { name: "e2e_rename", password: "password-1234" });
  await page.goto("/my-notebooks");
  const header = page.getByRole("banner");

  await header.getByRole("button", { name: "名前を編集" }).click();
  await header.getByRole("textbox", { name: "名前" }).fill("新しい名前");
  await header.getByRole("button", { name: "Save" }).click();
  await expect(header.getByText("新しい名前")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("banner").getByText("新しい名前")).toBeVisible();
});
