import Link from 'next/link';
import { Tv } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Tv size={64} className="empty-state__icon mb-md" />
      <h2 className="empty-state__title">404 - Page Not Found</h2>
      <p className="empty-state__text">This channel doesn't exist.</p>
      <Link href="/shows" className="btn btn-primary mt-md">
        Return Home
      </Link>
    </div>
  );
}
