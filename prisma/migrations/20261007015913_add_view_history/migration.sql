-- CreateTable
CREATE TABLE "notebook_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notebook_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notebook_views_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "notebooks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "section_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sectionSlug" TEXT NOT NULL,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "section_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "notebook_views_userId_lastViewedAt_idx" ON "notebook_views"("userId", "lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notebook_views_userId_notebookId_key" ON "notebook_views"("userId", "notebookId");

-- CreateIndex
CREATE INDEX "section_views_userId_lastViewedAt_idx" ON "section_views"("userId", "lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "section_views_userId_language_sectionSlug_key" ON "section_views"("userId", "language", "sectionSlug");
