import { expect, test } from "@playwright/test";

import { E2E_USER } from "./constants";

// このファイルは未ログインの状態から始める
test.use({ storageState: { cookies: [], origins: [] } });

test("未ログインで保護されたページを開くと、戻り先つきでログインへ飛ぶ", async ({ page }) => {
  await page.goto("/learn/chinese/05");
  await expect(page).toHaveURL(/\/login\?redirect=%2Flearn%2Fchinese%2F05$/);
});

test("ログインすると単語帳の一覧に入れ、ログアウトすると保護ページに入れなくなる", async ({
  page,
}) => {
  // 外部サイトへの戻り先(オープンリダイレクト)は無視され、既定の /my-notebooks へ飛ぶ
  await page.goto("/login?redirect=https://evil.example.com");
  await page.getByLabel("ユーザー名").fill(E2E_USER.username);
  await page.getByLabel(/パスワード/).fill(E2E_USER.password);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/my-notebooks$/);

  await page
    .getByRole("button", { name: /ログアウト/ })
    .first()
    .click();
  await expect(page.getByRole("link", { name: /ログイン/ }).first()).toBeVisible();
  await page.goto("/my-notebooks");
  await expect(page).toHaveURL(/\/login/);
});
