'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

interface EpisodeRowProps {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  isWatched: boolean;
  showName: string;
  onToggle: (seasonNumber: number, episodeNumber: number, watched: boolean, runtime: number | null, episodeName: string) => void;
}

export default function EpisodeRow({
  seasonNumber,
  episodeNumber,
  name,
  airDate,
  runtime,
  isWatched,
  showName,
  onToggle,
}: EpisodeRowProps) {
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = airDate ? airDate > todayStr : false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || isFuture) return;
    setLoading(true);
    await onToggle(seasonNumber, episodeNumber, !isWatched, runtime, name);
    setLoading(false);
  };

  const formattedDate = airDate
    ? new Date(airDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className={`episode-row ${isWatched ? 'watched-row' : ''} ${isFuture ? 'future-row' : ''}`}>
      <button
        className={`episode-row__check ${isWatched ? 'watched' : ''} ${isFuture ? 'future' : ''}`}
        onClick={handleToggle}
        disabled={loading || isFuture}
        title={isFuture ? 'Not aired yet' : isWatched ? 'Mark as unwatched' : 'Mark as watched'}
        aria-label={`${isWatched ? 'Unmark' : 'Mark'} ${showName} S${seasonNumber}E${episodeNumber} as watched`}
        aria-pressed={isWatched}
        style={isFuture ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
      >
        {isWatched && <Check size={16} strokeWidth={3} />}
        {loading && !isWatched && (
          <div style={{ width: 12, height: 12, border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        )}
      </button>
      <div className="episode-row__info">
        <div className="episode-row__number">
          Episode {episodeNumber}
          {runtime && <span> · {runtime} min</span>}
        </div>
        <div className="episode-row__title">{name}</div>
        {formattedDate && (
          <div className="episode-row__date" style={isFuture ? { color: 'var(--accent)' } : {}}>
            {isFuture ? `Airs ${formattedDate}` : formattedDate}
          </div>
        )}
      </div>
    </div>
  );
}
