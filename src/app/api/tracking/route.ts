import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

import { getShowDetails, getAiredEpisodesCount, TMDBShowDetails } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tracked = await prisma.showTracking.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' }
    });

    const todayStr = new Date().toISOString().split('T')[0];

    for (const tracking of tracked) {
      if (tracking.status === 'upcoming') {
        try {
          const tmdbData = await getShowDetails(tracking.tmdbShowId);
          if (tmdbData && tmdbData.first_air_date && tmdbData.first_air_date <= todayStr) {
            tracking.status = 'watching';
            await prisma.showTracking.update({
              where: { id: tracking.id },
              data: { status: 'watching' }
            });
          }
        } catch (e) {
          console.error('Failed to update upcoming show', e);
        }
      }
    }

    return NextResponse.json({ tracked });
  } catch (error) {
    console.error('Tracking GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tmdbShowId, status, showName, posterPath } = await req.json();

    if (!tmdbShowId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    let totalEpisodes = 0;
    let tmdbStatus = '';
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbShowId}?api_key=${process.env.TMDB_API_KEY}`);
      if (res.ok) {
        const data: TMDBShowDetails = await res.json();
        totalEpisodes = getAiredEpisodesCount(data);
        tmdbStatus = data.status || '';
      }
    } catch (e) {
      console.error('Failed to fetch total episodes', e);
    }

    const tracking = await prisma.showTracking.upsert({
      where: {
        userId_tmdbShowId: { userId: user.userId, tmdbShowId }
      },
      update: { status, showName, posterPath, totalEpisodes, tmdbStatus, updatedAt: new Date() },
      create: { userId: user.userId, tmdbShowId, status, showName, posterPath, totalEpisodes, tmdbStatus }
    });

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Tracking POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmdbShowId = searchParams.get('showId');

    if (!tmdbShowId) {
      return NextResponse.json({ error: 'Missing showId' }, { status: 400 });
    }

    await prisma.showTracking.delete({
      where: {
        userId_tmdbShowId: { userId: user.userId, tmdbShowId: parseInt(tmdbShowId, 10) }
      }
    });

    // Also delete watched episodes for this show
    await prisma.watchedEpisode.deleteMany({
      where: { userId: user.userId, tmdbShowId: parseInt(tmdbShowId, 10) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
