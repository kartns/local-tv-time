import 'dotenv/config';
import fs from 'fs';
import { prisma } from '../src/lib/db';

async function main() {
  const data = JSON.parse(fs.readFileSync('tvtime-series-2026-07-03.json', 'utf8'));
  const pausedShows = data.filter((d: any) => d.status === 'watch_later' || d.status === 'stopped' || d.watch_later === true || d.watchLater === true);
  
  console.log(`Found ${pausedShows.length} paused shows in backup.`);

  let count = 0;
  for (const show of pausedShows) {
    const tvdbId = show.id?.tvdb;
    if (!tvdbId) continue;

    try {
      const findRes = await fetch(`https://api.themoviedb.org/3/find/${tvdbId}?external_source=tvdb_id&api_key=${process.env.TMDB_API_KEY}`);
      if (!findRes.ok) continue;
      
      const tmdbResult = await findRes.json();
      const tmdbShow = tmdbResult.tv_results?.[0];
      if (tmdbShow) {
        const update = await prisma.showTracking.updateMany({
          where: { tmdbShowId: tmdbShow.id },
          data: { status: 'paused' }
        });
        if (update.count > 0) {
          count++;
          console.log(`Paused: ${show.title}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Delay to respect rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Successfully moved ${count} shows to paused status.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
