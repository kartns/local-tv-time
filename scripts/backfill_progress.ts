import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { getAiredEpisodesCount, TMDBShowDetails } from '../src/lib/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  const shows = await prisma.showTracking.findMany();
  console.log(`Backfilling progress for ${shows.length} shows...`);

  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];
    
    // Get watched count (exclude specials)
    const watchedCount = await prisma.watchedEpisode.count({
      where: { tmdbShowId: show.tmdbShowId, userId: show.userId, seasonNumber: { gt: 0 } }
    });

    // Get total episodes and TMDB status from TMDB
    let totalEpisodes = 0;
    let tmdbStatus = '';
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${show.tmdbShowId}?api_key=${TMDB_API_KEY}`);
      if (res.ok) {
        const data: TMDBShowDetails = await res.json();
        totalEpisodes = getAiredEpisodesCount(data);
        tmdbStatus = data.status || '';
      }
    } catch (e) {
      console.error(`Failed to fetch TMDB for show ${show.tmdbShowId}`);
    }

    let newStatus = show.status;
    if (show.status !== 'dropped') {
      if (watchedCount > 0 && watchedCount >= totalEpisodes) {
        newStatus = (tmdbStatus === 'Ended' || tmdbStatus === 'Canceled') ? 'finished' : 'up_to_date';
      } else if (watchedCount > 0 && watchedCount < totalEpisodes) {
        newStatus = 'watching';
      } else if (watchedCount === 0) {
        newStatus = 'watchlist';
      }
    }

    // Update record
    await prisma.showTracking.update({
      where: { id: show.id },
      data: { watchedCount, totalEpisodes, tmdbStatus, status: newStatus }
    });

    console.log(`[${i+1}/${shows.length}] Updated "${show.showName}": ${watchedCount}/${totalEpisodes}`);
    await delay(100);
  }
  console.log('Backfill complete!');
}

main().finally(() => prisma.$disconnect());
