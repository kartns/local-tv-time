import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId as string;

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trackedShows: true,
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
      trackedShows: user.trackedShows.map(s => ({
        showId: s.showId,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
      watchedEpisodes: user.watchedEpisodes.map(e => ({
        showId: e.showId,
        episodeId: e.episodeId,
        seasonNumber: e.seasonNumber,
        episodeNumber: e.episodeNumber,
        watchedAt: e.watchedAt.toISOString(),
      })),
      ratings: user.ratings.map(r => ({
        showId: r.showId,
        episodeId: r.episodeId,
        score: r.score,
        review: r.review,
        createdAt: r.createdAt.toISOString(),
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
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId as string;
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
            showId: s.showId,
            status: s.status,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      // 3. Insert Watched Episodes
      if (backupData.watchedEpisodes.length > 0) {
        await tx.watchedEpisode.createMany({
          data: backupData.watchedEpisodes.map((e: any) => ({
            userId,
            showId: e.showId,
            episodeId: e.episodeId,
            seasonNumber: e.seasonNumber,
            episodeNumber: e.episodeNumber,
            watchedAt: e.watchedAt ? new Date(e.watchedAt) : new Date(),
          })),
        });
      }

      // 4. Insert Ratings
      if (backupData.ratings && backupData.ratings.length > 0) {
        await tx.rating.createMany({
          data: backupData.ratings.map((r: any) => ({
            userId,
            showId: r.showId,
            episodeId: r.episodeId,
            score: r.score,
            review: r.review || null,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            updatedAt: new Date(),
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
