'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tv, Plus } from 'lucide-react';
import ShowCard from '@/components/ShowCard';
import { useToastStore } from '@/stores/toast';
import { useTrackingStore } from '@/stores/tracking';

type ShowTracking = {
  id: number;
  tmdbShowId: number;
  showName: string;
  posterPath: string | null;
  status: string;
  watchedCount: number;
  totalEpisodes: number;
};

const FILTER_TABS = [
  { id: 'watching', label: 'Watching' },
  { id: 'up_to_date', label: 'Up to Date' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'paused', label: 'Paused' },
  { id: 'watchlist', label: "Haven't Started Yet" },
  { id: 'finished', label: 'Finished' },
  { id: 'dropped', label: 'Stopped' },
  { id: 'all', label: 'All Shows' },
];

export default function ShowsClient({ initialShows }: { initialShows: ShowTracking[] }) {
  const [shows, setShows] = useState<ShowTracking[]>(initialShows);
  const [filter, setFilterState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('showsFilter') || 'watching';
    }
    return 'watching';
  });
  
  // To prevent double fetch on mount, we use a ref to track if it's the initial render
  const [isMounted, setIsMounted] = useState(false);

  const setFilter = (id: string) => {
    setFilterState(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('showsFilter', id);
    }
  };
  
  const addToast = useToastStore((s) => s.addToast);
  const lastUpdated = useTrackingStore((s) => s.lastUpdated);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
    fetchShows();
  }, [lastUpdated]);

  const fetchShows = async () => {
    try {
      const res = await fetch('/api/tracking');
      if (res.ok) {
        const data = await res.json();
        setShows(data.tracked || []);
      }
    } catch (error) {
      addToast('Failed to load updated shows', 'error');
    }
  };

  const filteredShows = shows.filter(s => {
    if (filter === 'all') return s.status !== 'dropped';
    return s.status === filter;
  });

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">My Shows</h1>
      </header>

      <div className="filter-tabs mb-lg" role="tablist" aria-label="Show filters">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={filter === tab.id}
            className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {shows.length === 0 ? (
        <div className="empty-state">
          <Tv size={48} className="empty-state__icon" />
          <h2 className="empty-state__title">No shows yet</h2>
          <p className="empty-state__text">Start tracking the shows you're watching or want to watch.</p>
          <Link href="/discover" className="btn btn-primary mt-md">
            <Plus size={18} /> Discover Shows
          </Link>
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">No shows found in this category.</p>
        </div>
      ) : (
        <div className="show-grid">
          {filteredShows.map((show) => {
            const progress = show.totalEpisodes > 0 
              ? Math.round((show.watchedCount / show.totalEpisodes) * 100) 
              : 0;
            return (
              <ShowCard
                key={show.tmdbShowId}
                id={show.tmdbShowId}
                name={show.showName}
                posterPath={show.posterPath}
                progress={progress}
                status={show.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
