import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getShowDetails } from '@/lib/tmdb';
import webpush from 'web-push';

export async function GET(req: Request) {
  // Initialize VAPID at runtime (not build time) so Docker builds don't crash
  webpush.setVapidDetails(
    'mailto:hello@localtvtime.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

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

    // 2. Fetch all tracked shows that are 'watching' or 'up_to_date' for ALL users
    // (We want to update database state for everyone, even if they don't have push enabled)
    const trackedShows = await prisma.showTracking.findMany({
      where: {
        status: { in: ['watching', 'up_to_date', 'upcoming'] }
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

    // 4. Check who needs a notification or database state update
    for (const tracking of trackedShows) {
      const showData = tmdbMap.get(tracking.tmdbShowId);
      if (!showData) continue;

      // Handle upcoming -> watching
      if (tracking.status === 'upcoming' && showData.first_air_date && showData.first_air_date <= todayStr) {
        await prisma.showTracking.update({
          where: { id: tracking.id },
          data: { status: 'watching' }
        });
        continue;
      }

      if (!showData.next_episode_to_air) continue;

      const ep = showData.next_episode_to_air;
      
      // If the next episode airs today or earlier, the user is no longer up to date
      if (ep.air_date <= todayStr && tracking.status === 'up_to_date') {
        await prisma.showTracking.update({
          where: { id: tracking.id },
          data: { status: 'watching' }
        });
      }
      
      // If it airs today, send notifications
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
