'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Star } from 'lucide-react';
import ShowCard from '@/components/ShowCard';
import { SkeletonGrid } from '@/components/Skeletons';
import { useToastStore } from '@/stores/toast';

export default function DiscoverClient({ initialTrending, initialPopular }: { initialTrending: any[], initialPopular: any[] }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        searchTMDB(query);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchTMDB = async (q: string) => {
    try {
      setSearching(true);
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out people/movies if it's multi-search, or just use TV
        setSearchResults(data.results?.filter((r: any) => !r.media_type || r.media_type === 'tv') || []);
      }
    } catch (error) {
      addToast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">Discover</h1>
      </header>

      <div className="search-container mb-lg">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search for TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query ? (
        <div className="section slide-up">
          <div className="section-header">
            <h2 className="section-title">Search Results</h2>
          </div>
          {searching ? (
            <SkeletonGrid />
          ) : searchResults.length > 0 ? (
            <div className="show-grid">
              {searchResults.map((show) => (
                <ShowCard
                  key={show.id}
                  id={show.id}
                  name={show.name || show.title || ''}
                  posterPath={show.poster_path}
                  year={show.first_air_date ? show.first_air_date.substring(0, 4) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted">No shows found matching "{query}"</p>
          )}
        </div>
      ) : (
        <>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title flex items-center gap-sm">
                <TrendingUp size={20} className="text-accent" /> Trending This Week
              </h2>
            </div>
            <div className="carousel carousel-poster">
              {initialTrending.map((show) => (
                <ShowCard
                  key={show.id}
                  id={show.id}
                  name={show.name || ''}
                  posterPath={show.poster_path}
                />
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title flex items-center gap-sm">
                <Star size={20} className="text-accent" /> Popular Shows
              </h2>
            </div>
            <div className="show-grid">
              {initialPopular.map((show) => (
                <ShowCard
                  key={show.id}
                  id={show.id}
                  name={show.name || ''}
                  posterPath={show.poster_path}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
