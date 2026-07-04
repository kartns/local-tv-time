import { getTrending, getPopular } from '@/lib/tmdb';
import DiscoverClient from './DiscoverClient';

export default async function DiscoverPage() {
  const [trendRes, popRes] = await Promise.all([
    getTrending(),
    getPopular()
  ]);

  const trending = trendRes.results?.slice(0, 10) || [];
  const popular = popRes.results?.slice(0, 12) || [];

  return <DiscoverClient initialTrending={trending} initialPopular={popular} />;
}
