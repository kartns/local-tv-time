import { create } from 'zustand';

interface TrackingState {
  lastUpdated: number;
  triggerUpdate: () => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  lastUpdated: Date.now(),
  triggerUpdate: () => set({ lastUpdated: Date.now() }),
}));
