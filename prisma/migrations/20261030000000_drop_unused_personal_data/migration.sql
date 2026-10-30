-- DB に侵入されたときに漏れる個人情報を減らすため、アプリで使わず保存済みのものを消す。
-- 以降は better-auth のフックで保存しないようにしている(app/lib/shared/personal-data.ts)。
-- ログインに要る accounts の accountId(Google のユーザー ID)とパスワードのハッシュは残す。
--
-- Google API は呼ばないので、OAuth のトークンは要らない
UPDATE "accounts" SET
  "accessToken" = NULL,
  "refreshToken" = NULL,
  "idToken" = NULL,
  "accessTokenExpiresAt" = NULL,
  "refreshTokenExpiresAt" = NULL;

-- IP アドレスと User-Agent はどこでも使っていない
UPDATE "sessions" SET "ipAddress" = NULL, "userAgent" = NULL;

-- Google で新規登録したユーザーの本物のメールとプロフィール画像。
-- メールは一意で空にできないので、Google のユーザー ID から作る架空のアドレスにする。
-- ユーザー名で登録したユーザーは、もともと架空の <username>@vocabook.local なので触らない
UPDATE "users" SET
  "email" = (
    SELECT "accountId" || '@google.vocabook.local' FROM "accounts"
    WHERE "accounts"."userId" = "users"."id" AND "accounts"."providerId" = 'google'
  ),
  "image" = NULL
WHERE "email" NOT LIKE '%@vocabook.local'
  AND EXISTS (
    SELECT 1 FROM "accounts"
    WHERE "accounts"."userId" = "users"."id" AND "accounts"."providerId" = 'google'
  );
