-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShowTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tmdbShowId" INTEGER NOT NULL,
    "showName" TEXT NOT NULL DEFAULT '',
    "posterPath" TEXT,
    "status" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShowTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchedEpisode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tmdbShowId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "showName" TEXT NOT NULL DEFAULT '',
    "episodeName" TEXT NOT NULL DEFAULT '',
    "runtimeMinutes" INTEGER,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchedEpisode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tmdbShowId" INTEGER NOT NULL,
    "seasonNum" INTEGER,
    "episodeNum" INTEGER,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TmdbCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cacheKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "ShowTracking_userId_idx" ON "ShowTracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowTracking_userId_tmdbShowId_key" ON "ShowTracking"("userId", "tmdbShowId");

-- CreateIndex
CREATE INDEX "WatchedEpisode_userId_idx" ON "WatchedEpisode"("userId");

-- CreateIndex
CREATE INDEX "WatchedEpisode_userId_tmdbShowId_idx" ON "WatchedEpisode"("userId", "tmdbShowId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedEpisode_userId_tmdbShowId_seasonNumber_episodeNumber_key" ON "WatchedEpisode"("userId", "tmdbShowId", "seasonNumber", "episodeNumber");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_tmdbShowId_seasonNum_episodeNum_key" ON "Rating"("userId", "tmdbShowId", "seasonNum", "episodeNum");

-- CreateIndex
CREATE UNIQUE INDEX "TmdbCache_cacheKey_key" ON "TmdbCache"("cacheKey");

-- CreateIndex
CREATE INDEX "TmdbCache_cacheKey_idx" ON "TmdbCache"("cacheKey");

-- CreateIndex
CREATE INDEX "TmdbCache_expiresAt_idx" ON "TmdbCache"("expiresAt");
