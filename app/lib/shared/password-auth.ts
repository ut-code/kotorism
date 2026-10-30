// ログインは Google だけ。本物の Google ログインは e2e で自動化できないため、
// e2e 用の PASSWORD_SIGNUP=true のときだけパスワードでの登録・ログインを許す
export function passwordAuthEnabled(env: Record<string, string | undefined>) {
  return env.PASSWORD_SIGNUP === "true";
}
