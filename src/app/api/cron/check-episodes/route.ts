import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getShowDetails } from '@/lib/tmdb';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:hello@localtvtime.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  // Simple auth for cron: e.g., require an Authorization header or a secret key in query
  // For easy testing locally, we'll accept the JWT_SECRET as a query param or header
  const authHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const secretParam = url.searchParams.get('secret');
  
  if (authHeader !== `Bearer ${process.env.JWT_SECRET}` && secretParam !== process.env.JWT_SECRET) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions' });
    }

    // Group by user
    const userIds = Array.from(new Set(subscriptions.map(s => s.userId)));

    // 2. Fetch all tracked shows for these users
    const trackedShows = await prisma.showTracking.findMany({
      where: {
        userId: { in: userIds },
        status: { in: ['watching', 'up_to_date'] }
      }
    });

    // 3. To optimize TMDB calls, deduplicate show IDs
    const uniqueShowIds = Array.from(new Set(trackedShows.map(s => s.tmdbShowId)));
    
    // Fetch TMDB data for these shows
    const tmdbPromises = uniqueShowIds.map(id => getShowDetails(id).catch(() => null));
    const tmdbResults = await Promise.all(tmdbPromises);

    // Map results by show ID
    const tmdbMap = new Map();
    uniqueShowIds.forEach((id, index) => {
      if (tmdbResults[index]) {
        tmdbMap.set(id, tmdbResults[index]);
      }
    });

    // Create localized today string
    // TMDB uses YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let notificationsSent = 0;

    // 4. Check who needs a notification
    for (const tracking of trackedShows) {
      const showData = tmdbMap.get(tracking.tmdbShowId);
      if (!showData || !showData.next_episode_to_air) continue;

      const ep = showData.next_episode_to_air;
      
      // If it airs today
      if (ep.air_date === todayStr) {
        // Find subscriptions for this user
        const userSubs = subscriptions.filter(s => s.userId === tracking.userId);
        
        for (const sub of userSubs) {
          const payload = JSON.stringify({
            title: `New Episode Today!`,
            body: `${tracking.showName} - S${ep.season_number} E${ep.episode_number}: ${ep.name}`,
            url: `/shows/${tracking.tmdbShowId}`,
            icon: showData.poster_path ? `https://image.tmdb.org/t/p/w154${showData.poster_path}` : undefined,
          });

          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              }
            }, payload);
            notificationsSent++;
          } catch (err: any) {
            console.error('Failed to send notification', err);
            // If subscription is invalid/expired, remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent, date: todayStr });
  } catch (error) {
    console.error('Cron check-episodes error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
