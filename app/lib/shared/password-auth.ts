// ログインは Google だけにしたが、Google を連携する前の既存ユーザーが締め出されないよう、
// 移行期間中は PASSWORD_LOGIN=true でユーザー名・パスワードのログインを残す。
// 新規登録は Google 経由にそろえるため、パスワードでの登録は e2e 用の PASSWORD_SIGNUP=true のときだけ許す
// (本物の Google ログインは e2e で自動化できないため)
export function passwordAuthFlags(env: Record<string, string | undefined>) {
  const signUp = env.PASSWORD_SIGNUP === "true";
  return { login: signUp || env.PASSWORD_LOGIN === "true", signUp };
}
