import { SkeletonEpisodeList } from '@/components/Skeletons';

export default function UpcomingLoading() {
  return (
    <div className="page-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Upcoming</h1>
          <p className="page-subtitle">Finding your next episodes...</p>
        </div>
      </div>
      
      <div className="section" style={{ marginTop: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Loading Schedule</h2>
        </div>
        <SkeletonEpisodeList count={5} />
      </div>
    </div>
  );
}
