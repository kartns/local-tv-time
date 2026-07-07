const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function getHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function fetchTMDB<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============ SEARCH ============

export async function searchShows(query: string, page = 1) {
  return fetchTMDB<TMDBSearchResult>('/search/tv', {
    query,
    page: page.toString(),
    language: 'en-US',
  });
}

export async function searchMulti(query: string, page = 1) {
  return fetchTMDB<TMDBSearchResult>('/search/multi', {
    query,
    page: page.toString(),
    language: 'en-US',
  });
}

// ============ TV SHOWS ============

export async function getShowDetails(showId: number) {
  return fetchTMDB<TMDBShowDetails>(`/tv/${showId}`, {
    language: 'en-US',
    append_to_response: 'credits,recommendations,watch/providers,images,external_ids',
  });
}

export async function getSeasonDetails(showId: number, seasonNumber: number) {
  return fetchTMDB<TMDBSeason>(`/tv/${showId}/season/${seasonNumber}`, {
    language: 'en-US',
  });
}

export async function getEpisodeDetails(showId: number, seasonNumber: number, episodeNumber: number) {
  return fetchTMDB<TMDBEpisode>(`/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    language: 'en-US',
  });
}

// ============ DISCOVER & TRENDING ============

export async function getTrending(timeWindow: 'day' | 'week' = 'week') {
  return fetchTMDB<TMDBSearchResult>(`/trending/tv/${timeWindow}`, {
    language: 'en-US',
  });
}

export async function getPopular(page = 1) {
  return fetchTMDB<TMDBSearchResult>('/tv/popular', {
    page: page.toString(),
    language: 'en-US',
  });
}

export async function getTopRated(page = 1) {
  return fetchTMDB<TMDBSearchResult>('/tv/top_rated', {
    page: page.toString(),
    language: 'en-US',
  });
}

export async function getOnTheAir(page = 1) {
  return fetchTMDB<TMDBSearchResult>('/tv/on_the_air', {
    page: page.toString(),
    language: 'en-US',
  });
}

export async function discoverByGenre(genreId: number, page = 1) {
  return fetchTMDB<TMDBSearchResult>('/discover/tv', {
    with_genres: genreId.toString(),
    page: page.toString(),
    sort_by: 'popularity.desc',
    language: 'en-US',
  });
}

export async function getGenres() {
  return fetchTMDB<{ genres: TMDBGenre[] }>('/genre/tv/list', {
    language: 'en-US',
  });
}

// ============ IMAGE HELPERS ============

export function getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) return '/no-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'): string {
  if (!path) return '/no-avatar.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// ============ TYPES ============

export interface TMDBSearchResult {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
}

export interface TMDBShow {
  id: number;
  name?: string;
  title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  media_type?: string;
  origin_country?: string[];
}

export interface TMDBShowDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  tagline: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: TMDBGenre[];
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  seasons: TMDBSeasonSummary[];
  last_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
  recommendations?: TMDBSearchResult;
  'watch/providers'?: {
    results: Record<string, TMDBWatchProviders>;
  };
  images?: {
    backdrops: { file_path: string }[];
    posters: { file_path: string }[];
  };
  external_ids?: {
    imdb_id?: string | null;
    tvdb_id?: number | null;
  };
}

export function getAiredEpisodesCount(showData: TMDBShowDetails): number {
  if (showData.status === 'Ended' || showData.status === 'Canceled') {
    return showData.seasons
      .filter(s => s.season_number > 0)
      .reduce((acc, s) => acc + s.episode_count, 0);
  }

  if (!showData.last_episode_to_air) {
    return 0; // hasn't aired yet
  }

  const lastAirSeason = showData.last_episode_to_air.season_number;
  const lastAirEp = showData.last_episode_to_air.episode_number;

  let count = 0;
  for (const season of showData.seasons) {
    if (season.season_number === 0) continue;
    
    if (season.season_number < lastAirSeason) {
      count += season.episode_count;
    } else if (season.season_number === lastAirSeason) {
      count += lastAirEp;
    }
  }
  
  return count;
}

export interface TMDBSeasonSummary {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  vote_average: number;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string | null;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBWatchProviders {
  link: string;
  flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
  rent?: { provider_id: number; provider_name: string; logo_path: string }[];
  buy?: { provider_id: number; provider_name: string; logo_path: string }[];
}
