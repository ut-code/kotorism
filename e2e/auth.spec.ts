import { expect, test } from "@playwright/test";

import { signUpWithPassword } from "./auth-helpers";

// このファイルは未ログインの状態から始める
test.use({ storageState: { cookies: [], origins: [] } });

test("未ログインで保護されたページを開くと、戻り先つきでログインへ飛ぶ", async ({ page }) => {
  await page.goto("/learn/chinese/05");
  await expect(page).toHaveURL(/\/login\?redirect=%2Flearn%2Fchinese%2F05$/);
});

test("ログイン中は単語帳の一覧に入れ、ログアウトすると保護ページに入れなくなる", async ({
  page,
}) => {
  await signUpWithPassword(page.request, { name: "e2e_logout", password: "password-1234" });
  await page.goto("/my-notebooks");
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

test.describe("未ログインのヘッダー（スマホ幅）", () => {
  test("1行に収まる幅では、ログイン・新規登録を折り畳まずに表示する", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
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
    // 460px では手元（macOS）で 3px しか余らず、CI（Linux）では文字の幅の違いで折り返していた
    await page.setViewportSize({ width: 460, height: 800 });
    await page.goto("/login");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "新規登録" })).toBeHidden();
    await header.getByRole("button", { name: "メニューを開く" }).click();
    await expect(header.getByRole("link", { name: "新規登録" })).toBeVisible();
  });
});
