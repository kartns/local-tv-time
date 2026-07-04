import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  fetchUser: async () => {
    try {
      set({ loading: true });
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    set({ user: null });
    window.location.href = '/login';
  },
}));
