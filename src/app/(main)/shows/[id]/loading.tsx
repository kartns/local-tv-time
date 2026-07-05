import { SkeletonEpisodeList } from '@/components/Skeletons';

export default function ShowDetailLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: '100%', height: 320, borderRadius: 0, margin: '0 -16px' }} />
      
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="skeleton skeleton-poster" style={{ width: 100, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '80%', height: 28, marginBottom: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ width: '30%', marginTop: 8 }} />
          </div>
        </div>
        
        <div className="section">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className="skeleton skeleton-text" style={{ width: 60, height: 32, borderRadius: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: 80, height: 32, borderRadius: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: 70, height: 32, borderRadius: 16 }} />
          </div>
          <SkeletonEpisodeList count={6} />
        </div>
      </div>
    </div>
  );
}
