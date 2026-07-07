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

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tvtime-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('WARNING: Importing will overwrite all your current tracked shows and watched history! Are you sure?')) {
      e.target.value = ''; // Reset input
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      if (!res.ok) throw new Error('Import failed');
      
      alert('Data imported successfully! Refreshing page...');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to import data. Ensure the JSON file is valid.');
    } finally {
      setImporting(false);
      e.target.value = '';
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
        
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Data Management</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Backup your tracked shows and watch history, or restore from a previous backup.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleExport}
              disabled={exporting}
              style={{ flex: 1 }}
            >
              {exporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>
              {importing ? 'Importing...' : 'Import Backup'}
              <input 
                type="file" 
                accept=".json" 
                style={{ display: 'none' }}
                onChange={handleImport}
                disabled={importing}
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
