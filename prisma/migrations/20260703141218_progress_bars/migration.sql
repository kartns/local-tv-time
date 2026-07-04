-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShowTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tmdbShowId" INTEGER NOT NULL,
    "showName" TEXT NOT NULL DEFAULT '',
    "posterPath" TEXT,
    "status" TEXT NOT NULL,
    "watchedCount" INTEGER NOT NULL DEFAULT 0,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShowTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShowTracking" ("addedAt", "id", "posterPath", "showName", "status", "tmdbShowId", "updatedAt", "userId") SELECT "addedAt", "id", "posterPath", "showName", "status", "tmdbShowId", "updatedAt", "userId" FROM "ShowTracking";
DROP TABLE "ShowTracking";
ALTER TABLE "new_ShowTracking" RENAME TO "ShowTracking";
CREATE INDEX "ShowTracking_userId_idx" ON "ShowTracking"("userId");
CREATE UNIQUE INDEX "ShowTracking_userId_tmdbShowId_key" ON "ShowTracking"("userId", "tmdbShowId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
