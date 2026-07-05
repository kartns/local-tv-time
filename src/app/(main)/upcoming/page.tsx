import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getShowDetails, getSeasonDetails } from '@/lib/tmdb';
import UpcomingClient, { UpcomingEpisode } from './UpcomingClient';

export const dynamic = 'force-dynamic';

export default async function UpcomingPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  // 1. Fetch user's tracked shows (watching or up to date)
  const trackedShows = await prisma.showTracking.findMany({
    where: {
      userId: user.userId,
      status: { in: ['watching', 'up_to_date'] }
    },
    select: { tmdbShowId: true, showName: true, posterPath: true }
  });

  if (trackedShows.length === 0) {
    return <UpcomingClient episodes={[]} />;
  }

  // 2. Fetch TMDB details in parallel
  const tmdbPromises = trackedShows.map(show => getShowDetails(show.tmdbShowId).catch(() => null));
  const tmdbResults = await Promise.all(tmdbPromises);

  // 3. For shows with upcoming episodes, fetch the full season to get ALL scheduled episodes
  const seasonPromises = tmdbResults.map((showData, index) => {
    if (!showData || !showData.next_episode_to_air) return Promise.resolve(null);
    return getSeasonDetails(trackedShows[index].tmdbShowId, showData.next_episode_to_air.season_number).catch(() => null);
  });
  
  const seasonResults = await Promise.all(seasonPromises);

  // 4. Extract and filter upcoming episodes
  const upcomingEpisodes: UpcomingEpisode[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  seasonResults.forEach((seasonData, index) => {
    if (!seasonData || !seasonData.episodes) return;
    
    // Check all episodes in the season
    seasonData.episodes.forEach((ep: any) => {
      if (!ep.air_date) return;
      const airDate = new Date(ep.air_date);
      airDate.setHours(0, 0, 0, 0);

      const diffTime = airDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Only include episodes airing today or in the future
      if (daysUntil >= 0) {
        upcomingEpisodes.push({
          showId: trackedShows[index].tmdbShowId,
          showName: trackedShows[index].showName,
          posterPath: trackedShows[index].posterPath,
          episodeName: ep.name,
          seasonNumber: ep.season_number,
          episodeNumber: ep.episode_number,
          airDate: ep.air_date,
          daysUntil
        });
      }
    });
  });

  // 5. Sort chronologically
  upcomingEpisodes.sort((a, b) => {
    return new Date(a.airDate).getTime() - new Date(b.airDate).getTime();
  });

  return <UpcomingClient episodes={upcomingEpisodes} />;
}
