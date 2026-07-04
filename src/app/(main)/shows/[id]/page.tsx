import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getShowDetails, getSeasonDetails } from '@/lib/tmdb';
import ShowDetailClient from './ShowDetailClient';

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  
  const unwrappedParams = await params;
  const showId = parseInt(unwrappedParams.id, 10);
  
  const [show, tracking, watchedRaw] = await Promise.all([
    getShowDetails(showId).catch(() => null),
    prisma.showTracking.findUnique({ where: { userId_tmdbShowId: { userId: user.userId, tmdbShowId: showId } } }),
    prisma.watchedEpisode.findMany({ where: { userId: user.userId, tmdbShowId: showId }, select: { seasonNumber: true, episodeNumber: true } })
  ]);
  
  if (!show) {
    return <div className="p-xl text-center">Show not found or TMDB error</div>;
  }
  
  const firstSeason = show.seasons.find((s: any) => s.season_number > 0)?.season_number || 1;
  const initialSeasonData = await getSeasonDetails(showId, firstSeason).catch(() => null);

  return (
    <ShowDetailClient 
      showId={showId} 
      show={show} 
      initialSeasonData={initialSeasonData} 
      initialTrackingStatus={(tracking?.status as any) || null} 
      initialWatchedEpisodes={watchedRaw} 
    />
  );
}
