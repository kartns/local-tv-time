'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import BottomNav from '@/components/BottomNav';
import ToastContainer from '@/components/ToastContainer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="app-container">
      {children}
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
