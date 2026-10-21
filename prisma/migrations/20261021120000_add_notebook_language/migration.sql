-- 単語の入力補助に使う、単語帳の言語。既存の単語帳は指定なし
ALTER TABLE "notebooks" ADD COLUMN "language" TEXT;
