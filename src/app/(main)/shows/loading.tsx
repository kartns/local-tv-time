import { SkeletonGrid } from '@/components/Skeletons';

export default function ShowsLoading() {
  return (
    <div className="page-header">
      <h1 className="page-title">My Shows</h1>
      <p className="page-subtitle">Loading your tracked shows...</p>
      <div className="section" style={{ marginTop: 24 }}>
        <SkeletonGrid count={8} />
      </div>
    </div>
  );
}
