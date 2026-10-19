-- My単語帳の一覧のお気に入りと並び順。既存の単語帳はお気に入りでなく、並び順は 0（作成日の新しい順に並ぶ）
ALTER TABLE "notebooks" ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notebooks" ADD COLUMN "listPosition" INTEGER NOT NULL DEFAULT 0;
