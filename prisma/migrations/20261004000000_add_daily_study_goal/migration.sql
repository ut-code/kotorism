-- AlterTable
ALTER TABLE "CardProgress" ADD COLUMN "masteredAt" DATETIME;

-- AlterTable
ALTER TABLE "user" ADD COLUMN "dailyGoal" INTEGER NOT NULL DEFAULT 5;
