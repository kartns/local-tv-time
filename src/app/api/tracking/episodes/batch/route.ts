import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tmdbShowId, showName, episodes } = await req.json();

    if (!tmdbShowId || !episodes || !Array.isArray(episodes)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Use Prisma transaction for batch insert
    const results = await prisma.$transaction(
      episodes.map((ep: any) => 
        prisma.watchedEpisode.upsert({
          where: {
            userId_tmdbShowId_seasonNumber_episodeNumber: {
              userId: user.userId,
              tmdbShowId,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber
            }
          },
          update: {}, // Do nothing if it exists
          create: {
            userId: user.userId,
            tmdbShowId,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            showName: showName || '',
            episodeName: ep.episodeName || '',
            runtimeMinutes: ep.runtimeMinutes
          }
        })
      )
    );

    const actualWatched = await prisma.watchedEpisode.count({
      where: { userId: user.userId, tmdbShowId, seasonNumber: { gt: 0 } }
    });
    
    const tracking = await prisma.showTracking.findUnique({
      where: { userId_tmdbShowId: { userId: user.userId, tmdbShowId } }
    });

    if (tracking) {
      let newStatus = tracking.status;
      if (tracking.status !== 'dropped') {
        if (actualWatched > 0 && actualWatched >= tracking.totalEpisodes) {
          newStatus = (tracking.tmdbStatus === 'Ended' || tracking.tmdbStatus === 'Canceled') ? 'finished' : 'up_to_date';
        } else if (actualWatched > 0 && actualWatched < tracking.totalEpisodes) {
          newStatus = 'watching';
        } else if (actualWatched === 0) {
          newStatus = 'watchlist';
        }
      }

      await prisma.showTracking.update({
        where: { id: tracking.id },
        data: { watchedCount: actualWatched, status: newStatus }
      });
    }

    return NextResponse.json({ count: results.length });
  } catch (error) {
    console.error('Batch episodes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
