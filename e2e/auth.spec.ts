import { expect, test, type Page } from "@playwright/test";

import { expectRedirectToGoogle, signUpWithPassword } from "./auth-helpers";
import { E2E_USER } from "./constants";

// このファイルは未ログインの状態から始める
test.use({ storageState: { cookies: [], origins: [] } });

// Google を連携する前の既存ユーザー向けに、移行期間中だけ残しているログイン
async function loginWithPassword(page: Page) {
  await page.getByText("以前のユーザー名でログインする").click();
  await page.getByLabel("ユーザー名").fill(E2E_USER.username);
  await page.getByLabel("パスワード").fill(E2E_USER.password);
  await page.getByRole("button", { name: "ユーザー名でログイン" }).click();
}

test("ログイン画面の「Google でログイン」で Google の認可画面へ移る", async ({ page }) => {
  await page.goto("/login");
  await expectRedirectToGoogle(page, () =>
    page.getByRole("button", { name: "Google でログイン" }).click(),
  );
});

test("新規登録は Google だけで、パスワードの入力欄は出さない", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel("パスワード")).toHaveCount(0);
  await expectRedirectToGoogle(page, () =>
    page.getByRole("button", { name: "Google で登録" }).click(),
  );
});

test("Google を連携していないユーザーには、My単語帳で連携を促す", async ({ page }) => {
  await signUpWithPassword(page.request, { username: "e2e_unlinked", password: "password-1234" });
  await page.goto("/my-notebooks");
  await expectRedirectToGoogle(page, () =>
    page.getByRole("button", { name: "Google アカウントを連携" }).click(),
  );
});

test("未ログインで保護されたページを開くと、戻り先つきでログインへ飛ぶ", async ({ page }) => {
  await page.goto("/learn/chinese/05");
  await expect(page).toHaveURL(/\/login\?redirect=%2Flearn%2Fchinese%2F05$/);
});

test("ログインすると単語帳の一覧に入れ、ログアウトすると保護ページに入れなくなる", async ({
  page,
}) => {
  // 外部サイトへの戻り先(オープンリダイレクト)は無視され、既定の /my-notebooks へ飛ぶ
  await page.goto("/login?redirect=https://evil.example.com");
  await loginWithPassword(page);
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
