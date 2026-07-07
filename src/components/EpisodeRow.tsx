'use client';

import { Check, Play, Tv, Globe, MonitorPlay, X } from 'lucide-react';
import { useOptimistic, startTransition, useState, useRef, useEffect } from 'react';
import styles from './EpisodeRow.module.css';

interface EpisodeRowProps {
  showId: number;
  imdbId?: string | null;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  isWatched: boolean;
  showName: string;
  providers?: any[];
  providerLink?: string;
  onToggle: (seasonNumber: number, episodeNumber: number, watched: boolean, runtime: number | null, episodeName: string) => void;
}

export default function EpisodeRow({
  showId,
  imdbId,
  seasonNumber,
  episodeNumber,
  name,
  airDate,
  runtime,
  isWatched,
  showName,
  providers = [],
  providerLink,
  onToggle,
}: EpisodeRowProps) {
  // Use React 19's useOptimistic to provide instant UI feedback
  const [optimisticWatched, addOptimisticWatched] = useOptimistic(
    isWatched,
    (state, newValue: boolean) => newValue
  );
  
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlayMenu(false);
      }
    };
    if (showPlayMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlayMenu]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = airDate ? airDate > todayStr : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFuture) return;
    
    // We immediately update the UI, then kick off the async action
    startTransition(() => {
      addOptimisticWatched(!optimisticWatched);
    });
    
    onToggle(seasonNumber, episodeNumber, !optimisticWatched, runtime, name);
  };

  const formattedDate = airDate
    ? new Date(airDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className={`${styles.episodeRow} ${optimisticWatched ? styles.watchedRow : ''} ${isFuture ? 'future-row' : ''}`}>
      <button
        className={`${styles.check} ${optimisticWatched ? styles.watched : ''} ${isFuture ? 'future' : ''}`}
        onClick={handleToggle}
        disabled={isFuture}
        title={isFuture ? 'Not aired yet' : optimisticWatched ? 'Mark as unwatched' : 'Mark as watched'}
        aria-label={`${optimisticWatched ? 'Unmark' : 'Mark'} ${showName} S${seasonNumber}E${episodeNumber} as watched`}
        aria-pressed={optimisticWatched}
        style={isFuture ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
      >
        {optimisticWatched && <Check size={16} strokeWidth={3} />}
      </button>
      <div className={styles.info}>
        <div className={styles.number}>
          Episode {episodeNumber}
          {runtime && <span> · {runtime} min</span>}
        </div>
        <div className={styles.title}>{name}</div>
        {formattedDate && (
          <div className={styles.date} style={isFuture ? { color: 'var(--accent)' } : {}}>
            {isFuture ? `Airs ${formattedDate}` : formattedDate}
          </div>
        )}
      </div>
      
      {!isFuture && (
        <div className={styles.actions} ref={menuRef}>
          <button 
            className={styles.playBtn}
            onClick={(e) => {
              e.stopPropagation();
              setShowPlayMenu(!showPlayMenu);
            }}
            title="Play options"
          >
            {showPlayMenu ? <X size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          
          {showPlayMenu && (
            <div className={styles.playMenu}>
              {imdbId ? (
                <>
                  <a 
                    href={`stremio://detail/series/${imdbId}/${imdbId}:${seasonNumber}:${episodeNumber}`}
                    className={styles.menuItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tv size={16} /> Stremio (App)
                  </a>
                  <a 
                    href={`https://web.stremio.com/#/detail/series/${imdbId}/${imdbId}:${seasonNumber}:${episodeNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.menuItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe size={16} /> Stremio (Web)
                  </a>
                </>
              ) : (
                <>
                  <a 
                    href={`stremio://detail/series/tmdb:${showId}/tmdb:${showId}:${seasonNumber}:${episodeNumber}`}
                    className={styles.menuItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tv size={16} /> Stremio (App)
                  </a>
                  <a 
                    href={`https://web.stremio.com/#/detail/series/tmdb:${showId}/tmdb:${showId}:${seasonNumber}:${episodeNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.menuItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe size={16} /> Stremio (Web)
                  </a>
                </>
              )}
              {providers && providers.length > 0 ? (
                <>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                  <div style={{ padding: '4px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Official Providers</div>
                  {providers.map((p: any) => (
                    <a 
                      key={p.provider_id}
                      href={providerLink || `https://www.themoviedb.org/tv/${showId}/watch`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.menuItem}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{ width: 16, height: 16, borderRadius: 2 }} />
                      {p.provider_name}
                    </a>
                  ))}
                </>
              ) : (
                <a 
                  href={providerLink || `https://www.themoviedb.org/tv/${showId}/watch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.menuItem}
                  onClick={(e) => e.stopPropagation()}
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <MonitorPlay size={16} /> Official Providers
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
