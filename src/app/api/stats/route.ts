import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Total episodes watched
    const totalEpisodes = await prisma.watchedEpisode.count({
      where: { userId: user.userId }
    });

    // 2. Total time watched (sum of runtimeMinutes)
    const episodes = await prisma.watchedEpisode.findMany({
      where: { userId: user.userId },
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

    let timeParts = [];
    if (y > 0) timeParts.push(`${y}y`);
    if (mo > 0) timeParts.push(`${mo}mo`);
    if (d > 0) timeParts.push(`${d}d`);
    if (h > 0) timeParts.push(`${h}h`);
    if (m > 0 || timeParts.length === 0) timeParts.push(`${m}m`);
    
    const formattedTotalTime = timeParts.join(' ');
    const totalHoursWatched = Math.floor(totalMinutes / 60);

    // 3. Total shows tracked
    const totalShows = await prisma.showTracking.count({
      where: { userId: user.userId, status: { not: 'watchlist' } }
    });

    // 4. Weekly activity (last 7 days, simple format for UI)
    // Create an array of the last 7 days
    const weeklyActivity = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const count = episodes.filter(ep => {
        const epDate = new Date(ep.watchedAt);
        epDate.setHours(0, 0, 0, 0);
        return epDate.getTime() === d.getTime();
      }).length;

      weeklyActivity.push({ name: dayName, count });
    }

    // 5. Recent activity (last 5)
    const recentActivity = await prisma.watchedEpisode.findMany({
      where: { userId: user.userId },
      orderBy: { watchedAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      totalHoursWatched,
      formattedTotalTime,
      totalEpisodes,
      totalShows,
      weeklyActivity,
      recentActivity
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
