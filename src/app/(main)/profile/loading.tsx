import { SkeletonStatCards } from '@/components/Skeletons';

export default function ProfileLoading() {
  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <div>
          <div className="skeleton skeleton-text" style={{ width: 120, height: 24, marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: 150 }} />
        </div>
      </div>
      
      <div className="section">
        <h2 className="section-title" style={{ marginBottom: 16 }}>Your Stats</h2>
        <SkeletonStatCards />
      </div>
    </div>
  );
}
