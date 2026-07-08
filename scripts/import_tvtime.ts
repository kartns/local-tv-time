import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchTMDB = async (endpoint: string) => {
  const url = `https://api.themoviedb.org/3${endpoint}`;
  const options = TMDB_ACCESS_TOKEN 
    ? { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
    : {};
    
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + `api_key=${TMDB_API_KEY}`, options);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
};

const mapStatus = (tvTimeStatus: string) => {
  switch (tvTimeStatus) {
    case 'not_started_yet': return 'watchlist';
    case 'watching': return 'watching';
    case 'up_to_date': return 'up_to_date';
    case 'ended': 
    case 'finished': return 'finished';
    case 'stopped': return 'dropped';
    default: return 'watchlist';
  }
};

async function main() {
  const username = process.argv[2];
  const backupFilename = process.argv[3];
  if (!username || !backupFilename) {
    console.error('Usage: npx tsx scripts/import_tvtime.ts <username> <backup_file.json>');
    process.exit(1);
  }

  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.log(`User '${username}' not found. Creating a new user...`);
    // Create a dummy user
    user = await prisma.user.create({
      data: {
        username,
        displayName: username,
        passwordHash: 'dummy_hash_change_later',
      }
    });
  }

  console.log(`Starting import for user: ${user.username} (ID: ${user.id})`);

  const backupFile = path.resolve(process.cwd(), backupFilename);
  console.log(`Reading backup file from ${backupFile}`);
  const rawData = fs.readFileSync(backupFile, 'utf-8');
  const shows = JSON.parse(rawData);

  console.log(`Found ${shows.length} shows to import. This will take a few minutes...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];
    const tvdbId = show.id?.tvdb;
    
    if (!tvdbId) {
      console.log(`[${i+1}/${shows.length}] Skipping "${show.title}" - No TVDB ID`);
      continue;
    }

    try {
      // 1. Map TVDB ID to TMDB ID
      const findRes = await fetchTMDB(`/find/${tvdbId}?external_source=tvdb_id`);
      const tmdbResult = findRes.tv_results?.[0];

      if (!tmdbResult) {
        console.log(`[${i+1}/${shows.length}] Skipping "${show.title}" - Not found on TMDB`);
        failCount++;
        await delay(250); // Rate limit delay
        continue;
      }

      const tmdbShowId = tmdbResult.id;
      const showName = tmdbResult.name;
      const posterPath = tmdbResult.poster_path;
      const status = mapStatus(show.status);

      // 2. Insert Show Tracking Record
      await prisma.showTracking.upsert({
        where: { userId_tmdbShowId: { userId: user.id, tmdbShowId } },
        update: { status, showName, posterPath },
        create: { userId: user.id, tmdbShowId, status, showName, posterPath }
      });

      // 3. Process Watched Episodes
      const episodesToInsert = [];
      for (const season of show.seasons || []) {
        for (const ep of season.episodes || []) {
          if (ep.is_watched) {
            episodesToInsert.push({
              userId: user.id,
              tmdbShowId,
              seasonNumber: season.number,
              episodeNumber: ep.number,
              showName: showName,
              episodeName: ep.name || '',
              watchedAt: ep.watched_at ? new Date(ep.watched_at) : new Date()
            });
          }
        }
      }

      if (episodesToInsert.length > 0) {
        // Use createMany to insert in bulk (ignoring duplicates if they exist)
        for(const ep of episodesToInsert) {
           await prisma.watchedEpisode.upsert({
             where: {
               userId_tmdbShowId_seasonNumber_episodeNumber: {
                 userId: ep.userId,
                 tmdbShowId: ep.tmdbShowId,
                 seasonNumber: ep.seasonNumber,
                 episodeNumber: ep.episodeNumber
               }
             },
             update: {},
             create: ep
           }).catch(() => {}); // Catch silent unique constraints if any
        }
      }

      console.log(`[${i+1}/${shows.length}] Imported "${showName}" (${episodesToInsert.length} episodes)`);
      successCount++;
      
    } catch (err) {
      console.log(`[${i+1}/${shows.length}] Error importing "${show.title}":`, err instanceof Error ? err.message : String(err));
      failCount++;
    }

    // Delay to avoid hitting TMDB rate limits (40 requests per second is the limit, but we'll go safe)
    await delay(100); 
  }

  console.log('--- Import Complete ---');
  console.log(`Successfully imported: ${successCount} shows`);
  console.log(`Failed/Skipped: ${failCount} shows`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
