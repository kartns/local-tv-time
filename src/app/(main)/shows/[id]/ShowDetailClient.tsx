'use client';

import { useState, useEffect } from 'react';
import { useToastStore } from '@/stores/toast';
import { useRouter } from 'next/navigation';
import { Star, Check, Play, Pause, ListPlus, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import EpisodeRow from '@/components/EpisodeRow';
import Modal from '@/components/Modal';
import { useTrackingStore } from '@/stores/tracking';
import useSWR from 'swr';

type TrackingStatus = 'watching' | 'watchlist' | 'up_to_date' | 'finished' | 'dropped' | 'paused' | 'upcoming' | null;

export default function ShowDetailClient({
  showId,
  show,
  initialSeasonData,
  initialTrackingStatus,
  initialWatchedEpisodes
}: {
  showId: number;
  show: any;
  initialSeasonData: any;
  initialTrackingStatus: TrackingStatus;
  initialWatchedEpisodes: { seasonNumber: number; episodeNumber: number }[];
}) {
  const router = useRouter();
  
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>(initialTrackingStatus);
  const [activeSeason, setActiveSeason] = useState<number>(initialSeasonData?.season_number || 1);
  const [watchedEpisodes, setWatchedEpisodes] = useState<{ seasonNumber: number; episodeNumber: number }[]>(initialWatchedEpisodes);
  
  const [batchPrompt, setBatchPrompt] = useState<{
    unwatchedPrevious: any[],
    currentEpisode: any
  } | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);

  const addToast = useToastStore((s) => s.addToast);
  const triggerUpdate = useTrackingStore((s) => s.triggerUpdate);

  const { data: fetchedSeasonData, isValidating } = useSWR(
    activeSeason !== initialSeasonData?.season_number ? `/api/tmdb/show/${showId}/season/${activeSeason}` : null,
    (url) => fetch(url).then(res => res.json())
  );

  const seasonData = activeSeason === initialSeasonData?.season_number ? initialSeasonData : fetchedSeasonData;
  const seasonLoading = isValidating && !fetchedSeasonData;

  const updateTracking = async (status: string) => {
    const prevStatus = trackingStatus;
    setTrackingStatus(status as TrackingStatus); // Optimistic UI
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbShowId: showId, status, showName: show.name, posterPath: show.poster_path })
      });
      if (res.ok) {
        triggerUpdate();
        addToast(`Moved to ${status.replace('_', ' ')}`);
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      setTrackingStatus(prevStatus); // Revert
      addToast('Failed to update tracking', 'error');
    }
  };

  const loadShowData = async () => {
    // If optimistic updates completely fail, we refresh the page to get the server truth
    router.refresh();
  };

  const toggleEpisode = async (seasonNumber: number, episodeNumber: number, watched: boolean, runtime: number | null, episodeName: string) => {
    try {
      const avgRuntime = (show?.episode_run_time && show.episode_run_time.length > 0) ? show.episode_run_time[0] : 45;
      const finalRuntime = runtime || avgRuntime;

      // Auto-start watching if we mark an episode
      if (!trackingStatus || trackingStatus === 'watchlist' || trackingStatus === 'upcoming') {
        updateTracking('watching');
      }

      if (watched) {
        // Find unwatched previous episodes
        const unwatchedPrevious: any[] = [];
        for (const s of show.seasons) {
          if (s.season_number === 0) continue; // Skip specials
          if (s.season_number < seasonNumber) {
            for (let e = 1; e <= s.episode_count; e++) {
              const isW = watchedEpisodes.some(w => w.seasonNumber === s.season_number && w.episodeNumber === e);
              if (!isW) unwatchedPrevious.push({ seasonNumber: s.season_number, episodeNumber: e, runtimeMinutes: avgRuntime });
            }
          }
        }
        for (let e = 1; e < episodeNumber; e++) {
          const isW = watchedEpisodes.some(w => w.seasonNumber === seasonNumber && w.episodeNumber === e);
          if (!isW) unwatchedPrevious.push({ seasonNumber, episodeNumber: e, runtimeMinutes: avgRuntime });
        }

        if (unwatchedPrevious.length > 0) {
          setBatchPrompt({
            unwatchedPrevious,
            currentEpisode: { seasonNumber, episodeNumber, episodeName, runtimeMinutes: finalRuntime }
          });
          return;
        }

        // Optimistic UI for current one
        setWatchedEpisodes(prev => [...prev, { seasonNumber, episodeNumber }]);
        if (!trackingStatus || trackingStatus === 'watchlist' || trackingStatus === 'upcoming') {
          setTrackingStatus('watching');
        }

        const res = await fetch('/api/tracking/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdbShowId: showId,
            seasonNumber,
            episodeNumber,
            showName: show.name,
            episodeName,
            runtimeMinutes: finalRuntime
          })
        });
        if (!res.ok) throw new Error('Failed');

        triggerUpdate();
        addToast(`Marked S${seasonNumber}E${episodeNumber} as watched`);
      } else {
        // Optimistic UI for unmarking
        setWatchedEpisodes(prev => prev.filter(e => !(e.seasonNumber === seasonNumber && e.episodeNumber === episodeNumber)));

        const res = await fetch('/api/tracking/episodes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbShowId: showId, seasonNumber, episodeNumber })
        });
        if (!res.ok) throw new Error('Failed');

        triggerUpdate();
      }
    } catch (error) {
      addToast('Failed to update episode', 'error');
      loadShowData(); // Revert to server truth on error
    }
  };

  const backdropUrl = show.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` 
    : (show.poster_path ? `https://image.tmdb.org/t/p/w780${show.poster_path}` : '');
  
  const providers = show['watch/providers']?.results?.['US']?.flatrate || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const hasStarted = show.first_air_date && show.first_air_date <= todayStr;

  return (
    <div className="fade-in" style={{ paddingBottom: 64 }}>
      <div className="hero">
        <button 
          onClick={() => router.back()} 
          className="btn-icon" 
          style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#fff' }}
        >
          <ChevronLeft size={28} />
        </button>
        {backdropUrl && (
          <img src={backdropUrl} alt={show.name} className="hero__backdrop" />
        )}
        <div className="hero__gradient"></div>
        <div className="hero__content">
          <div className="flex items-center gap-sm mb-sm text-accent" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {show.status} • {show.first_air_date?.substring(0, 4)}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>
            {show.name}
          </h1>
          <div className="flex items-center gap-md text-sm text-primary">
            <div className="flex items-center gap-sm">
              <Star size={16} className="text-accent" fill="var(--accent)" />
              {show.vote_average?.toFixed(1)}
            </div>
            <div>{show.number_of_seasons} Seasons</div>
          </div>
        </div>
      </div>

      <div className="flex gap-md mb-lg" style={{ marginTop: 16 }}>
        {(!trackingStatus || trackingStatus === 'watchlist' || trackingStatus === 'dropped') ? (
          <button className="btn btn-primary flex-1" onClick={() => updateTracking(hasStarted ? 'watching' : 'upcoming')}>
            <Play size={20} fill="currentColor" /> {hasStarted ? 'Start Watching' : 'Track Show (Upcoming)'}
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-sm font-semibold" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            {trackingStatus === 'up_to_date' ? <><Check size={18} /> Up to Date</> : 
             trackingStatus === 'finished' ? <><Check size={18} /> Finished</> : 
             trackingStatus === 'paused' ? <><Pause size={18} fill="currentColor" /> Paused</> : 
             trackingStatus === 'upcoming' ? <><CalendarIcon size={18} /> Upcoming</> :
             <><Play size={18} fill="currentColor" /> Watching</>}
          </div>
        )}
        
        {(!trackingStatus || trackingStatus === 'watchlist' || trackingStatus === 'dropped') ? (
          <button 
            className="btn btn-secondary flex-1" 
            onClick={() => updateTracking(trackingStatus === 'watchlist' ? 'dropped' : 'watchlist')}
          >
            {trackingStatus === 'watchlist' ? <Check size={20} /> : <ListPlus size={20} />} 
            {trackingStatus === 'watchlist' ? "In Haven't Started Yet" : "Haven't Started Yet"}
          </button>
        ) : (
          <>
            {trackingStatus !== 'upcoming' && (
              <button 
                className="btn btn-secondary flex-1" 
                onClick={() => updateTracking(trackingStatus === 'paused' ? 'watching' : 'paused')}
              >
                {trackingStatus === 'paused' ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />} 
                {trackingStatus === 'paused' ? 'Resume' : 'Pause'}
              </button>
            )}
            <button 
              className="btn btn-secondary flex-1" 
              onClick={() => setShowStopModal(true)}
              style={{ color: 'var(--error)' }}
            >
              Stop
            </button>
          </>
        )}
      </div>

      <p className="text-secondary mb-lg" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
        {show.overview}
      </p>

      {providers.length > 0 && (
        <div className="mb-lg">
          <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-sm">Where to Watch</div>
          <div className="providers">
            {providers.map((p: any) => (
              <div key={p.provider_id} className="provider-logo" title={p.provider_name}>
                <img src={`https://image.tmdb.org/t/p/w154${p.logo_path}`} alt={p.provider_name} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="tabs mb-md" role="tablist" aria-label="Seasons">
          {show.seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={activeSeason === s.season_number}
              className={`tab ${activeSeason === s.season_number ? 'active' : ''}`}
              onClick={() => setActiveSeason(s.season_number)}
            >
              Season {s.season_number}
            </button>
          ))}
        </div>

        <div className="bg-secondary rounded-lg border border-border">
          {seasonLoading || !seasonData ? (
            <div className="p-4 text-center text-muted">Loading episodes...</div>
          ) : (
            <div>
              {seasonData.episodes.map((ep: any) => {
                const isWatched = watchedEpisodes.some(w => w.seasonNumber === ep.season_number && w.episodeNumber === ep.episode_number);
                return (
                  <EpisodeRow
                    key={ep.id}
                    showId={showId}
                    imdbId={show.external_ids?.imdb_id}
                    showName={show.name}
                    seasonNumber={ep.season_number}
                    episodeNumber={ep.episode_number}
                    name={ep.name}
                    airDate={ep.air_date}
                    runtime={ep.runtime}
                    isWatched={isWatched}
                    onToggle={toggleEpisode}
                    providers={providers}
                    providerLink={show['watch/providers']?.results?.['US']?.link || `https://www.themoviedb.org/tv/${showId}/watch`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {show.credits?.cast?.length > 0 && (
        <div className="section slide-up">
          <h2 className="section-title mb-md">Cast</h2>
          <div className="carousel carousel-poster">
            {show.credits.cast.slice(0, 10).map((actor: any) => (
              <div key={actor.id} style={{ width: 120 }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', marginBottom: 8, background: 'var(--bg-elevated)' }}>
                  <img src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '/no-avatar.svg'} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.character}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal 
        isOpen={!!batchPrompt} 
        onClose={() => setBatchPrompt(null)}
        title="Mark Previous Episodes?"
      >
        <p className="text-secondary" style={{ lineHeight: 1.5, marginBottom: 16 }}>
          You have <strong>{batchPrompt?.unwatchedPrevious.length}</strong> unwatched previous episodes 
          across this and previous seasons. Would you like to mark them all as watched too?
        </p>
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={async () => {
              if (!batchPrompt) return;
              const ep = batchPrompt.currentEpisode;
              
              setWatchedEpisodes(prev => [...prev, { seasonNumber: ep.seasonNumber, episodeNumber: ep.episodeNumber }]);
              setBatchPrompt(null);
              
              await fetch('/api/tracking/episodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tmdbShowId: showId,
                  seasonNumber: ep.seasonNumber,
                  episodeNumber: ep.episodeNumber,
                  showName: show.name,
                  episodeName: ep.episodeName,
                  runtimeMinutes: ep.runtimeMinutes
                })
              });
              
              addToast(`Marked S${ep.seasonNumber}E${ep.episodeNumber} as watched`);
            }}
          >
            No, just this one
          </button>
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              if (!batchPrompt) return;
              const allToMark = [...batchPrompt.unwatchedPrevious, batchPrompt.currentEpisode];
              
              // Optimistic UI
              setWatchedEpisodes(prev => [...prev, ...allToMark]);
              setBatchPrompt(null);

              try {
                const res = await fetch('/api/tracking/episodes/batch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tmdbShowId: showId, showName: show.name, episodes: allToMark })
                });
                if (!res.ok) throw new Error('Failed');
                
                addToast(`Marked ${allToMark.length} previous episodes as watched`);
                triggerUpdate();
              } catch (e) {
                addToast('Failed to mark previous episodes', 'error');
                loadShowData(); // Revert
              }
            }}
          >
            Yes, mark all
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="Stop Watching?"
      >
        <p className="text-secondary" style={{ lineHeight: 1.5, marginBottom: 16 }}>
          Are you sure you want to stop watching this show? It will be moved to your Stopped list.
        </p>
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowStopModal(false)}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--error)', color: '#fff' }}
            onClick={() => {
              updateTracking('dropped');
              setShowStopModal(false);
            }}
          >
            Stop Watching
          </button>
        </div>
      </Modal>

    </div>
  );
}
