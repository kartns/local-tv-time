'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ShowCard.module.css';

interface ShowCardProps {
  id: number;
  name: string;
  posterPath: string | null;
  year?: string;
  progress?: number; // 0-100
  episodeInfo?: string;
  status?: string;
}

export default function ShowCard({ id, name, posterPath, year, progress, episodeInfo, status }: ShowCardProps) {
  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  return (
    <Link href={`/shows/${id}`} className={styles.showCard}>
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={name}
          width={342}
          height={342}
          className={styles.poster}
          unoptimized
        />
      ) : (
        <div className={styles.poster} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          padding: '12px',
          textAlign: 'center',
        }}>
          {name}
        </div>
      )}
      {progress !== undefined && progress > 0 && (
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              background: status === 'dropped' ? 'var(--error)' : (status === 'up_to_date' || status === 'finished') ? 'var(--success)' : 'var(--accent)',
              boxShadow: status === 'dropped' ? '0 0 8px var(--error-dim)' : (status === 'up_to_date' || status === 'finished') ? '0 0 8px var(--success-dim)' : '0 0 8px var(--accent-glow)'
            }}
          />
        </div>
      )}
      <div className={styles.info}>
        <div className={styles.title}>{name}</div>
        {(year || episodeInfo) && (
          <div className={styles.meta}>
            {episodeInfo || year}
          </div>
        )}
      </div>
    </Link>
  );
}
