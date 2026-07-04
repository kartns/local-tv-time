'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { LogOut, User, Clock, Tv, Calendar, Bell, BellRing } from 'lucide-react';

type Stats = {
  totalHoursWatched: number;
  formattedTotalTime?: string;
  totalEpisodes: number;
  totalShows: number;
  weeklyActivity: { name: string; count: number }[];
  recentActivity: any[];
};

export default function ProfileClient({ stats }: { stats: Stats }) {
  const { user, logout } = useAuthStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported by your browser.');
      return;
    }
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      
      if (isSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify(sub),
          });
        }
        setIsSubscribed(false);
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(sub),
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Push error:', err);
      alert('Failed to toggle push notifications. Please check browser permissions.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between page-header mb-md">
        <div className="flex items-center gap-md">
          <div className="btn-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', width: 56, height: 56 }}>
            <User size={32} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{user?.displayName}</h1>
            <p className="text-secondary">@{user?.username}</p>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost" title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      <div className="stat-grid mb-lg">
        <div className="stat-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card__value" style={{ fontSize: '1.25rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
            {stats.formattedTotalTime || stats.totalHoursWatched}
          </div>
          <div className="stat-card__label flex items-center gap-sm">
            <Clock size={14} /> Total Time
          </div>
        </div>
        <div className="stat-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card__value">{stats.totalEpisodes}</div>
          <div className="stat-card__label flex items-center gap-sm">
            <Calendar size={14} /> Episodes
          </div>
        </div>
        <div className="stat-card slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card__value">{stats.totalShows}</div>
          <div className="stat-card__label flex items-center gap-sm">
            <Tv size={14} /> Shows Tracked
          </div>
        </div>
        <div className="stat-card slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="stat-card__value">
            {stats.totalShows > 0 ? (stats.totalEpisodes / stats.totalShows).toFixed(1) : '0'}
          </div>
          <div className="stat-card__label">Avg Eps/Show</div>
        </div>
      </div>

      <div className="section slide-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="section-title">Viewing Activity (Last 7 Days)</h2>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '24px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, marginTop: 16 }}>
          {stats.weeklyActivity.map((day, i) => {
            const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1);
            const height = `${Math.max((day.count / maxCount) * 100, 5)}%`;
            
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: '100%', maxWidth: 32, height: 120, display: 'flex', alignItems: 'flex-end', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height, background: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day.name}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{day.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section slide-up" style={{ animationDelay: '0.6s' }}>
        <h2 className="section-title mb-md">Settings</h2>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {isSubscribed ? <BellRing size={18} color="var(--accent)" /> : <Bell size={18} />}
              Push Notifications
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Get alerted when new episodes air</div>
          </div>
          <button 
            className={`btn ${isSubscribed ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handlePushToggle}
            disabled={subscribing}
            style={{ minWidth: 100 }}
          >
            {subscribing ? 'Wait...' : isSubscribed ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
