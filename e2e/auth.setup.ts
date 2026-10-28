import { test as setup } from "@playwright/test";

import { signUpWithPassword } from "./auth-helpers";
import { E2E_USER, STORAGE_STATE } from "./constants";

// サインアップはレート制限(10 秒に 3 回)があるので、最初に 1 回だけ行ってログイン状態を使い回す
setup("e2e ユーザーを作成してログイン状態を保存する", async ({ page }) => {
  await signUpWithPassword(page.request, E2E_USER);
  await page.context().storageState({ path: STORAGE_STATE });
});
