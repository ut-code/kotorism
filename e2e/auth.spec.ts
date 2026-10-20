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

test("未ログインのヘッダーには My単語帳・学習教材 のリンクを出さない", async ({ page }) => {
  await page.goto("/login");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: /ログイン/ }).first()).toBeVisible();
  await expect(header.getByRole("link", { name: "My単語帳" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "学習教材" })).toHaveCount(0);
});

test("ログイン中のヘッダーには My単語帳・学習教材 のリンクを出す", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("ユーザー名").fill(E2E_USER.username);
  await page.getByLabel(/パスワード/).fill(E2E_USER.password);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/my-notebooks$/);

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "My単語帳" })).toBeVisible();
  await expect(header.getByRole("link", { name: "学習教材" })).toBeVisible();
});

test.describe("未ログインのヘッダー（スマホ幅）", () => {
  test("1行に収まる幅では、ログイン・新規登録を折り畳まずに表示する", async ({ page }) => {
    await page.setViewportSize({ width: 440, height: 800 });
    await page.goto("/login");
    const header = page.getByRole("banner");
    const signup = header.getByRole("link", { name: "新規登録" });
    await expect(header.getByRole("link", { name: "ログイン" })).toBeVisible();
    await expect(signup).toBeVisible();
    await expect(header.getByRole("button", { name: "メニューを開く" })).toBeHidden();

    // ロゴと同じ行に並んでいる（折り返していない）
    const logo = await header.getByRole("link", { name: /ロゴ/ }).boundingBox();
    const signupBox = await signup.boundingBox();
    expect(signupBox!.y).toBeLessThan(logo!.y + logo!.height);
  });

  test("収まらない幅では、ハンバーガーメニューにまとめる", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "新規登録" })).toBeHidden();
    await header.getByRole("button", { name: "メニューを開く" }).click();
    await expect(header.getByRole("link", { name: "新規登録" })).toBeVisible();
  });
});
