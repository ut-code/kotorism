-- CreateTable
CREATE TABLE "study_time_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "deckId" TEXT,
    "language" TEXT,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "study_time_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "study_streaks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDay" TEXT NOT NULL,
    "celebratedStreak" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "study_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_study_daily_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deckId" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "study_daily_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_study_daily_stats" ("count", "day", "deckId", "eventType", "id", "language", "userId") SELECT "count", "day", "deckId", "eventType", "id", "language", "userId" FROM "study_daily_stats";
DROP TABLE "study_daily_stats";
ALTER TABLE "new_study_daily_stats" RENAME TO "study_daily_stats";
CREATE INDEX "study_daily_stats_userId_day_idx" ON "study_daily_stats"("userId", "day");
CREATE UNIQUE INDEX "study_daily_stats_userId_day_eventType_deckId_language_key" ON "study_daily_stats"("userId", "day", "eventType", "deckId", "language");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "study_time_logs_userId_day_idx" ON "study_time_logs"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "study_time_logs_userId_clientId_day_key" ON "study_time_logs"("userId", "clientId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "study_streaks_userId_key" ON "study_streaks"("userId");
