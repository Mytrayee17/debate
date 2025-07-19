// If you haven't installed Zustand, run: npm install zustand @types/zustand
import { create, StateCreator } from 'zustand';

interface GamificationState {
  points: number;
  level: number;
  badges: string[];
  progress: Array<{ date: string; points: number; level: number }>;
  addPoints: (amount: number) => void;
  addBadge: (badge: string) => void;
  reset: () => void;
}

type ProgressEntry = { date: string; points: number; level: number };

const initial = (): Omit<GamificationState, 'addPoints' | 'addBadge' | 'reset'> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gamification');
    if (saved) return JSON.parse(saved);
  }
  return { points: 0, level: 1, badges: [], progress: [] };
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  ...initial(),
  addPoints: (amount: number) => {
    set((state: GamificationState) => {
      const newPoints = state.points + amount;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const newProgress: ProgressEntry[] = [
        ...state.progress,
        { date: new Date().toISOString(), points: newPoints, level: newLevel },
      ];
      const next = { ...state, points: newPoints, level: newLevel, progress: newProgress };
      if (typeof window !== 'undefined') localStorage.setItem('gamification', JSON.stringify(next));
      return next;
    });
  },
  addBadge: (badge: string) => {
    set((state: GamificationState) => {
      if (state.badges.includes(badge)) return state;
      const next = { ...state, badges: [...state.badges, badge] };
      if (typeof window !== 'undefined') localStorage.setItem('gamification', JSON.stringify(next));
      return next;
    });
  },
  reset: () => {
    const next = { points: 0, level: 1, badges: [], progress: [] };
    if (typeof window !== 'undefined') localStorage.setItem('gamification', JSON.stringify(next));
    set(next);
  },
})); 