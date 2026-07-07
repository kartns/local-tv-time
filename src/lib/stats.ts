import { prisma } from '@/lib/db';

export async function getUserStats(userId: number) {
  // 1. Total episodes watched
  const totalEpisodes = await prisma.watchedEpisode.count({
    where: { userId }
  });

  // 2. Total time watched (sum of runtimeMinutes)
  const episodes = await prisma.watchedEpisode.findMany({
    where: { userId },
    select: { runtimeMinutes: true, watchedAt: true, showName: true }
  });

  let totalMinutes = 0;
  episodes.forEach(ep => {
    totalMinutes += ep.runtimeMinutes || 45;
  });
  
  let rem = totalMinutes;
  const m = rem % 60;
  rem = Math.floor(rem / 60); // total hours
  const h = rem % 24;
  rem = Math.floor(rem / 24); // total days
  const d = rem % 30;
  rem = Math.floor(rem / 30); // total months
  const mo = rem % 12;
  const y = Math.floor(rem / 12); // total years

  const timeParts = [];
  if (y > 0) timeParts.push(`${y}y`);
  if (mo > 0) timeParts.push(`${mo}mo`);
  if (d > 0) timeParts.push(`${d}d`);
  if (h > 0) timeParts.push(`${h}h`);
  if (m > 0 || timeParts.length === 0) timeParts.push(`${m}m`);
  
  const formattedTotalTime = timeParts.join(' ');
  const totalHoursWatched = Math.floor(totalMinutes / 60);

  // 3. Total shows tracked
  const totalShows = await prisma.showTracking.count({
    where: { userId, status: { not: 'watchlist' } }
  });

  // 4. Weekly activity
  const weeklyActivity = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const count = episodes.filter(ep => {
      const epDate = new Date(ep.watchedAt);
      epDate.setHours(0, 0, 0, 0);
      return epDate.getTime() === date.getTime();
    }).length;

    weeklyActivity.push({ name: dayName, count });
  }

  // 5. Recent activity
  const recentActivity = await prisma.watchedEpisode.findMany({
    where: { userId },
    orderBy: { watchedAt: 'desc' },
    take: 5
  });

  return {
    totalHoursWatched,
    formattedTotalTime,
    totalEpisodes,
    totalShows,
    weeklyActivity,
    recentActivity
  };
}
