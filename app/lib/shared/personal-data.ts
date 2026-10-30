// DB に侵入されたときに漏れる個人情報を減らすため、アプリで使わないものは保存しない。
// ログインに要るのは accounts の Google のユーザー ID(accountId)だけなので、それ以外を落としてもログインはできる

// better-auth はメールで既存ユーザーを探す(暗黙のアカウント紐付け)ので、メールは空にできない。
// 既存ユーザーの <username>@vocabook.local と同じく架空のアドレスにし、Google のユーザー ID で一意にする
export function googleProfileToUser(profile: { sub: string }) {
  return { email: `${profile.sub}@google.vocabook.local`, image: undefined };
}

// Google API は呼ばないのでトークンは不要。undefined だと更新時に列が無視されて古い値が残るため null で上書きする
export function withoutOAuthTokens<T extends object>(account: T) {
  return {
    ...account,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  };
}

export function withoutClientInfo<T extends object>(session: T) {
  return { ...session, ipAddress: null, userAgent: null };
}
