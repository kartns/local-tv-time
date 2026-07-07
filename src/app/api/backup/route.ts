import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getAuthUser();

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(payload.userId);

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        showTracking: true,
        watchedEpisodes: true,
        ratings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the backup payload (exclude sensitive info like password)
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      trackedShows: user.showTracking.map(s => ({
        tmdbShowId: s.tmdbShowId,
        showName: s.showName,
        posterPath: s.posterPath,
        status: s.status,
        tmdbStatus: s.tmdbStatus,
        watchedCount: s.watchedCount,
        totalEpisodes: s.totalEpisodes,
        addedAt: s.addedAt ? new Date(s.addedAt).toISOString() : new Date().toISOString(),
      })),
      watchedEpisodes: user.watchedEpisodes.map(e => ({
        tmdbShowId: e.tmdbShowId,
        seasonNumber: e.seasonNumber,
        episodeNumber: e.episodeNumber,
        showName: e.showName,
        episodeName: e.episodeName,
        runtimeMinutes: e.runtimeMinutes,
        watchedAt: e.watchedAt ? new Date(e.watchedAt).toISOString() : new Date().toISOString(),
      })),
      ratings: user.ratings.map(r => ({
        tmdbShowId: r.tmdbShowId,
        seasonNum: r.seasonNum,
        episodeNum: r.episodeNum,
        score: r.score,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      })),
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getAuthUser();

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;
    const backupData = await request.json();

    if (!backupData || !backupData.trackedShows || !backupData.watchedEpisodes) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    // Perform restoration inside a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // 1. Wipe existing data for this user
      await tx.showTracking.deleteMany({ where: { userId } });
      await tx.watchedEpisode.deleteMany({ where: { userId } });
      await tx.rating.deleteMany({ where: { userId } });

      // 2. Insert Tracked Shows
      if (backupData.trackedShows.length > 0) {
        await tx.showTracking.createMany({
          data: backupData.trackedShows.map((s: any) => ({
            userId,
            tmdbShowId: s.tmdbShowId,
            showName: s.showName || "",
            posterPath: s.posterPath || null,
            status: s.status,
            tmdbStatus: s.tmdbStatus || "",
            watchedCount: s.watchedCount || 0,
            totalEpisodes: s.totalEpisodes || 0,
            addedAt: s.addedAt ? new Date(s.addedAt) : new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      // 3. Insert Watched Episodes
      if (backupData.watchedEpisodes.length > 0) {
        await tx.watchedEpisode.createMany({
          data: backupData.watchedEpisodes.map((e: any) => ({
            userId,
            tmdbShowId: e.tmdbShowId,
            seasonNumber: e.seasonNumber,
            episodeNumber: e.episodeNumber,
            showName: e.showName || "",
            episodeName: e.episodeName || "",
            runtimeMinutes: e.runtimeMinutes || null,
            watchedAt: e.watchedAt ? new Date(e.watchedAt) : new Date(),
          })),
        });
      }

      // 4. Insert Ratings
      if (backupData.ratings && backupData.ratings.length > 0) {
        await tx.rating.createMany({
          data: backupData.ratings.map((r: any) => ({
            userId,
            tmdbShowId: r.tmdbShowId,
            seasonNum: r.seasonNum || null,
            episodeNum: r.episodeNum || null,
            score: r.score,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
