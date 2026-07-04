'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export type UpcomingEpisode = {
  showId: number;
  showName: string;
  posterPath: string | null;
  episodeName: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string;
  daysUntil: number;
};

export default function UpcomingClient({ episodes }: { episodes: UpcomingEpisode[] }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // For calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateEpisodes, setSelectedDateEpisodes] = useState<UpcomingEpisode[] | null>(null);

  // ====== LIST VIEW LOGIC ======
  const today: UpcomingEpisode[] = [];
  const thisWeek: UpcomingEpisode[] = [];
  const nextWeek: UpcomingEpisode[] = [];
  const later: UpcomingEpisode[] = [];

  episodes.forEach(ep => {
    if (ep.daysUntil === 0) today.push(ep);
    else if (ep.daysUntil > 0 && ep.daysUntil <= 7) thisWeek.push(ep);
    else if (ep.daysUntil > 7 && ep.daysUntil <= 14) nextWeek.push(ep);
    else later.push(ep);
  });

  const renderListGroup = (title: string, group: UpcomingEpisode[]) => {
    if (group.length === 0) return null;

    return (
      <div className="section slide-up mb-xl">
        <h2 className="section-title mb-md flex items-center gap-sm">
          {title} <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>({group.length})</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {group.map((ep) => {
            const posterUrl = ep.posterPath ? `https://image.tmdb.org/t/p/w154${ep.posterPath}` : null;
            const formattedDate = new Date(ep.airDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return (
              <Link 
                href={`/shows/${ep.showId}`} 
                key={`${ep.showId}-${ep.seasonNumber}-${ep.episodeNumber}`}
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  background: 'var(--bg-secondary)', 
                  padding: 12, 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
                }}
                className="upcoming-row"
              >
                <div style={{ width: 80, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-elevated)', aspectRatio: '4/5' }}>
                  {posterUrl ? (
                    <Image src={posterUrl} alt={ep.showName} width={80} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: 4 }}>{ep.showName}</div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{ep.showName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                    S{ep.seasonNumber} E{ep.episodeNumber} • {ep.episodeName}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: ep.daysUntil === 0 ? 'var(--accent)' : 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
                    <CalendarIcon size={14} /> 
                    {ep.daysUntil === 0 ? 'Airing Today!' : formattedDate}
                    {ep.daysUntil > 0 && <span style={{ color: 'var(--text-muted)' }}> (in {ep.daysUntil} day{ep.daysUntil > 1 ? 's' : ''})</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ====== CALENDAR VIEW LOGIC ======
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month (0 = Sun, 1 = Mon...)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const todayStr = new Date().toISOString().split('T')[0];

    // Build grid cells
    const cells = [];
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Headers
    WEEKDAYS.forEach(day => {
      cells.push(
        <div key={`header-${day}`} className="cal-header">
          {day}
        </div>
      );
    });

    // Empty pads
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      // Create a localized ISO string for comparison (YYYY-MM-DD)
      // Since TMDB dates are YYYY-MM-DD, we pad manually to match
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      // Find episodes airing on this day
      const dayEpisodes = episodes.filter(ep => ep.airDate === dateStr);
      const isMultiple = dayEpisodes.length > 1;

      cells.push(
        <div key={`day-${d}`} className={`cal-cell ${isToday ? 'is-today' : ''} ${dayEpisodes.length > 0 ? 'has-episodes' : ''}`}>
          <div className="cal-day-num">{d}</div>
          <div className="cal-eps">
            {isMultiple ? (
              <button 
                onClick={() => setSelectedDateEpisodes(dayEpisodes)} 
                className="cal-ep-card" 
                title={`${dayEpisodes.length} Episodes`}
                style={{ position: 'relative', cursor: 'pointer', padding: 0 }}
              >
                {dayEpisodes[0].posterPath ? (
                  <Image src={`https://image.tmdb.org/t/p/w154${dayEpisodes[0].posterPath}`} alt={dayEpisodes[0].showName} width={60} height={90} className="cal-poster" unoptimized />
                ) : (
                  <div className="cal-poster-fallback">{dayEpisodes[0].showName}</div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
                  +{dayEpisodes.length - 1}
                </div>
              </button>
            ) : dayEpisodes.length === 1 ? (
              <Link href={`/shows/${dayEpisodes[0].showId}`} key={`${dayEpisodes[0].showId}-${dayEpisodes[0].episodeNumber}`} className="cal-ep-card" title={`${dayEpisodes[0].showName} - S${dayEpisodes[0].seasonNumber}E${dayEpisodes[0].episodeNumber}`}>
                {dayEpisodes[0].posterPath ? (
                  <Image src={`https://image.tmdb.org/t/p/w154${dayEpisodes[0].posterPath}`} alt={dayEpisodes[0].showName} width={60} height={90} className="cal-poster" unoptimized />
                ) : (
                  <div className="cal-poster-fallback">{dayEpisodes[0].showName}</div>
                )}
              </Link>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-container slide-up">
        <div className="calendar-nav flex items-center justify-between mb-md">
          <button className="btn-icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="section-title" style={{ margin: 0 }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button className="btn-icon" onClick={() => changeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="calendar-grid">
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <header className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Upcoming</h1>
          <p className="page-subtitle">Your personalized release calendar.</p>
        </div>
        
        {/* VIEW TOGGLE */}
        <div className="view-toggle" role="tablist">
          <button 
            role="tab"
            aria-selected={viewMode === 'list'}
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List View"
          >
            <List size={18} />
          </button>
          <button 
            role="tab"
            aria-selected={viewMode === 'calendar'}
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            aria-label="Calendar View"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </header>

      <style jsx global>{`
        .upcoming-row:hover {
          transform: translateX(4px);
          border-color: var(--border-hover);
        }

        .view-toggle {
          display: flex;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 2px;
          border: 1px solid var(--border-color);
        }
        .toggle-btn {
          padding: 8px 12px;
          border-radius: calc(var(--radius-sm) - 2px);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .toggle-btn.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .toggle-btn:hover:not(.active) {
          color: var(--text-primary);
        }

        /* CALENDAR CSS */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          background: var(--border-color); /* Acts as border for cells */
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .cal-header {
          background: var(--bg-secondary);
          padding: 8px 4px;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .cal-cell {
          background: var(--bg-primary);
          aspect-ratio: 3/4;
          padding: 0;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .cal-cell.empty {
          background: var(--bg-secondary);
        }
        .cal-cell.is-today {
          background: var(--accent-dim);
          border: 1px solid var(--accent);
        }
        .cal-day-num {
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 20;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          background: rgba(0,0,0,0.6);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cal-cell.is-today .cal-day-num {
          background: var(--accent);
          color: white;
        }
        .cal-eps {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .cal-ep-card {
          flex: 1 1 auto;
          min-height: 0;
          border-radius: 0;
          overflow: hidden;
          background: var(--bg-elevated);
          border: none;
          transition: filter var(--transition-fast);
        }
        .cal-ep-card:hover {
          filter: brightness(1.2);
          z-index: 10;
        }
        .cal-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cal-poster-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.55rem;
          text-align: center;
          padding: 2px;
          color: var(--text-muted);
          word-break: break-word;
          line-height: 1.1;
        }

        @media (min-width: 768px) {
          .cal-cell {
            aspect-ratio: 1/1;
          }
        }
      `}</style>

      {episodes.length === 0 ? (
        <div className="empty-state slide-up">
          <CalendarIcon size={48} className="empty-state__icon" />
          <h2 className="empty-state__title">Nothing Upcoming</h2>
          <p className="empty-state__text">None of the shows you're watching have upcoming episodes scheduled.</p>
        </div>
      ) : viewMode === 'list' ? (
        <>
          {renderListGroup('Airing Today', today)}
          {renderListGroup('This Week', thisWeek)}
          {renderListGroup('Next Week', nextWeek)}
          {renderListGroup('Later On', later)}
        </>
      ) : (
        renderCalendar()
      )}

      {selectedDateEpisodes && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setSelectedDateEpisodes(null)}
        >
          <div 
            className="slide-up"
            style={{ background: 'var(--bg-primary)', width: '100%', maxWidth: 600, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '24px 16px', maxHeight: '80vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {new Date(selectedDateEpisodes[0].airDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button 
                onClick={() => setSelectedDateEpisodes(null)} 
                style={{ background: 'var(--bg-secondary)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                X
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedDateEpisodes.map(ep => {
                const posterUrl = ep.posterPath ? `https://image.tmdb.org/t/p/w154${ep.posterPath}` : null;
                return (
                  <Link 
                    href={`/shows/${ep.showId}`} 
                    key={`${ep.showId}-${ep.seasonNumber}-${ep.episodeNumber}`}
                    style={{ display: 'flex', gap: 16, background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  >
                    <div style={{ width: 60, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-elevated)', aspectRatio: '4/5' }}>
                      {posterUrl ? (
                        <Image src={posterUrl} alt={ep.showName} width={60} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>{ep.showName}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{ep.showName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>S{ep.seasonNumber} E{ep.episodeNumber} • {ep.episodeName}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
