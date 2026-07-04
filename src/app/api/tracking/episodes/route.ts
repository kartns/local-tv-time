import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmdbShowId = searchParams.get('showId');

    if (!tmdbShowId) {
      return NextResponse.json({ error: 'Missing showId' }, { status: 400 });
    }

    const watched = await prisma.watchedEpisode.findMany({
      where: { 
        userId: user.userId,
        tmdbShowId: parseInt(tmdbShowId, 10)
      }
    });

    return NextResponse.json({ watched });
  } catch (error) {
    console.error('WatchedEpisodes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tmdbShowId, seasonNumber, episodeNumber, showName, episodeName, runtimeMinutes } = await req.json();

    if (!tmdbShowId || seasonNumber === undefined || episodeNumber === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const watched = await prisma.watchedEpisode.create({
      data: {
        userId: user.userId,
        tmdbShowId,
        seasonNumber,
        episodeNumber,
        showName: showName || '',
        episodeName: episodeName || '',
        runtimeMinutes
      }
    });

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

    return NextResponse.json({ watched });
  } catch (error) {
    console.error('WatchedEpisodes POST error:', error);
    // Unique constraint failed means already watched, which is fine
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
       return NextResponse.json({ success: true, message: 'Already watched' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tmdbShowId, seasonNumber, episodeNumber } = await req.json();

    if (!tmdbShowId || seasonNumber === undefined || episodeNumber === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await prisma.watchedEpisode.delete({
      where: {
        userId_tmdbShowId_seasonNumber_episodeNumber: {
          userId: user.userId,
          tmdbShowId,
          seasonNumber,
          episodeNumber
        }
      }
    });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WatchedEpisodes DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
