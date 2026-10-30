import { expect, type APIRequestContext } from "@playwright/test";

// 本物の Google ログインは自動化できないので、e2e だけ有効にしている(PASSWORD_SIGNUP=true)
// パスワード登録の API で直接ユーザーを作る。登録に成功するとレスポンスの Cookie でログイン状態になる
export async function signUpWithPassword(
  request: APIRequestContext,
  user: { name: string; password: string },
) {
  const res = await request.post("/api/auth/sign-up/email", {
    data: { name: user.name, email: `${user.name}@example.test`, password: user.password },
  });
  expect(res.ok()).toBe(true);
}
