import { SkeletonGrid } from '@/components/Skeletons';

export default function DiscoverLoading() {
  return (
    <div className="page-header">
      <h1 className="page-title">Discover</h1>
      <p className="page-subtitle">Finding the best shows for you...</p>
      
      <div className="section" style={{ marginTop: 24 }}>
        <div className="section-header">
          <h2 className="section-title">Trending Today</h2>
        </div>
        <SkeletonGrid count={6} />
      </div>
      
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Popular Shows</h2>
        </div>
        <SkeletonGrid count={6} />
      </div>
    </div>
  );
}
