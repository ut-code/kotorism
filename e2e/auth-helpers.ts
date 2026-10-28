import { expect, type APIRequestContext, type Page } from "@playwright/test";

// 本物の Google ログインは自動化できないので、e2e だけ有効にしている(PASSWORD_SIGNUP=true)
// パスワード登録の API で直接ユーザーを作る。登録に成功するとレスポンスの Cookie でログイン状態になる
export async function signUpWithPassword(
  request: APIRequestContext,
  user: { username: string; password: string },
) {
  const res = await request.post("/api/auth/sign-up/email", {
    data: {
      name: user.username,
      email: `${user.username}@vocabook.local`,
      password: user.password,
      username: user.username,
    },
  });
  expect(res.ok()).toBe(true);
}

// Google の認可画面へ実際には行かせず、遷移先の URL だけを確かめる
export async function expectRedirectToGoogle(page: Page, click: () => Promise<void>) {
  await page.route("https://accounts.google.com/**", (route) => route.abort());
  const request = page.waitForRequest((req) =>
    req.url().startsWith("https://accounts.google.com/"),
  );
  await click();
  expect(new URL((await request).url()).searchParams.get("client_id")).toBe("e2e-google-client-id");
}
