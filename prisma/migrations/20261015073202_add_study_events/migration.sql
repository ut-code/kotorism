-- CreateTable
CREATE TABLE "study_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "deckId" TEXT,
    "language" TEXT,
    CONSTRAINT "study_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_daily_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deckId" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "study_daily_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "study_events_userId_occurredAt_idx" ON "study_events"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "study_daily_stats_userId_day_idx" ON "study_daily_stats"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "study_daily_stats_userId_day_eventType_deckId_language_key" ON "study_daily_stats"("userId", "day", "eventType", "deckId", "language");

-- 既存ログからの取り込み。
-- 作文・翻訳は提出ごとに日時が残っているので、1提出 = 1イベントとして移す。
-- カードの★・表示回数（card_progress）や学習教材の進捗（section_progress）は累計値と最終更新日時しか
-- 持たず、いつ何回学習したかを復元できないため取り込まない
INSERT INTO "study_events" ("id", "userId", "occurredAt", "eventType", "itemId", "deckId", "language")
SELECT 'essay_' || "id", "userId", "createdAt", 'essay', "id", NULL, "language"
FROM "essay_submissions";

INSERT INTO "study_events" ("id", "userId", "occurredAt", "eventType", "itemId", "deckId", "language")
SELECT 'translation_' || "id", "userId", "createdAt", 'translation', "id", NULL, "language"
FROM "translation_submissions";

-- 取り込んだイベントを日本時間の日付ごとに集計する（lib/study-calendar.ts の toStudyDay と同じ区切り）
INSERT INTO "study_daily_stats" ("id", "userId", "day", "eventType", "deckId", "language", "count")
SELECT
    lower(hex(randomblob(12))),
    "userId",
    date("occurredAt", '+9 hours'),
    "eventType",
    coalesce("deckId", ''),
    coalesce("language", ''),
    count(*)
FROM "study_events"
GROUP BY "userId", date("occurredAt", '+9 hours'), "eventType", coalesce("deckId", ''), coalesce("language", '');
