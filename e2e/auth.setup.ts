import { expect, test as setup } from "@playwright/test";

import { E2E_USER, STORAGE_STATE } from "./constants";

// サインアップはレート制限(10 秒に 3 回)があるので、最初に 1 回だけ行ってログイン状態を使い回す
setup("e2e ユーザーを作成してログイン状態を保存する", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("ユーザー名").fill(E2E_USER.username);
  await page.getByLabel(/パスワード/).fill(E2E_USER.password);
  await page.getByRole("button", { name: "アカウントを作成" }).click();
  await expect(page).toHaveURL(/\/my-notebooks$/);
  await page.context().storageState({ path: STORAGE_STATE });
});
