-- Better Auth 1.7.3 以降はアカウント識別に issuer を使わないため、不要な列と一意制約を取り除く。
DROP INDEX "accounts_issuer_accountId_key";
ALTER TABLE "accounts" DROP COLUMN "issuer";
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");
