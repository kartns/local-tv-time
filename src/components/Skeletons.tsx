'use client';

export function SkeletonCard() {
  return (
    <div className="show-card">
      <div className="skeleton skeleton-poster" />
      <div className="show-card__info">
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: 6 }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="show-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="episode-row">
      <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
      <div className="episode-row__info">
        <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%', marginTop: 6 }} />
      </div>
    </div>
  );
}

export function SkeletonEpisodeList({ count = 8 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatCards() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-text" style={{ width: '60%', height: 32 }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', height: 12, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
