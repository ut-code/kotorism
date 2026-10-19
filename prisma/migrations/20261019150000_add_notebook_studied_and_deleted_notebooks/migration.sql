-- My単語帳の一覧の「学習済み」。既存の単語帳は学習中のまま
ALTER TABLE "notebooks" ADD COLUMN "studied" BOOLEAN NOT NULL DEFAULT false;

-- 削除した単語帳の名前の控え（学習カレンダーで元の名前を出すため）
CREATE TABLE "deleted_notebooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
