'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, List as ListIcon, X } from 'lucide-react';
import Link from 'next/link';
import ShowCard from '@/components/ShowCard';

export default function ListClient({ listId }: { listId: string }) {
  const router = useRouter();
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    fetchList();
  }, [listId]);

  const fetchList = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        const data = await res.json();
        setList(data);
      } else {
        router.push('/profile');
      }
    } catch (err) {
      console.error(err);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/profile');
      } else {
        alert('Failed to delete list');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleRemoveItem = async (e: React.MouseEvent, tmdbShowId: number) => {
    e.preventDefault(); // Prevent navigating to show page
    try {
      const res = await fetch(`/api/lists/${listId}/items?tmdbShowId=${tmdbShowId}`, { method: 'DELETE' });
      if (res.ok) {
        setList((prev: any) => ({
          ...prev,
          items: prev.items.filter((item: any) => item.tmdbShowId !== tmdbShowId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="flex items-center gap-sm page-header mb-md">
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
          <div className="skeleton" style={{ width: 150, height: 32 }}></div>
        </div>
        <div className="show-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton skeleton-poster"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between page-header mb-md">
        <div className="flex items-center gap-md">
          <button onClick={() => router.back()} className="btn-icon">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title">{list.name}</h1>
            <p className="text-secondary">{list.items.length} shows</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfirmDelete(true)} 
          className="btn-icon" 
          style={{ color: 'var(--error)' }}
          title="Delete list"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {list.items.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '48px 24px', textAlign: 'center', marginTop: 32 }}>
          <ListIcon size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>This list is empty</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You haven't added any shows to this list yet.</div>
          <Link href="/discover" className="btn btn-primary">
            Discover Shows
          </Link>
        </div>
      ) : (
        <div className="show-grid slide-up">
          {list.items.map((item: any) => (
            <div key={item.id} style={{ position: 'relative' }}>
              <Link href={`/shows/${item.tmdbShowId}`}>
                <ShowCard
                  show={{
                    id: item.tmdbShowId,
                    name: item.showName,
                    poster_path: item.posterPath,
                  }}
                  hideProgressBar
                />
              </Link>
              <button
                onClick={(e) => handleRemoveItem(e, item.tmdbShowId)}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  width: 32,
                  height: 32,
                  zIndex: 10,
                }}
                title="Remove from list"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, overflow: 'hidden', padding: 24, textAlign: 'center' }}>
            <Trash2 size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8 }}>Delete List?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Are you sure you want to delete "{list.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--error)', color: '#fff' }} 
                onClick={handleDeleteList}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
