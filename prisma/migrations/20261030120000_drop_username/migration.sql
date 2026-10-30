-- ログインを Google だけにし、ユーザー名ログイン(better-auth の username プラグイン)を外したため、その列を消す。
-- 表示名は name 列にあるので、消しても画面の表示は変わらない
DROP INDEX "users_username_key";
ALTER TABLE "users" DROP COLUMN "username";
ALTER TABLE "users" DROP COLUMN "displayUsername";
