import { create } from 'zustand';
import type { LauncherMode, Prompt, SearchResult } from '../types';

interface LauncherState {
  mode: LauncherMode;
  searchQuery: string;
  riderText: string;
  promotedPrompt: Prompt | null;
  selectedIndex: number;
  results: SearchResult[];
  isVisible: boolean;

  // Actions
  setMode: (mode: LauncherMode) => void;
  setSearchQuery: (query: string) => void;
  setRiderText: (text: string) => void;
  promotePrompt: (prompt: Prompt) => void;
  clearPromotion: () => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number) => void;
  setResults: (results: SearchResult[]) => void;
  setVisible: (visible: boolean) => void;
  reset: () => void;
}

const initialState = {
  mode: 'search' as LauncherMode,
  searchQuery: '',
  riderText: '',
  promotedPrompt: null,
  selectedIndex: 0,
  results: [],
  isVisible: true, // Start visible since window starts visible
};

export const useLauncherStore = create<LauncherState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setSearchQuery: (searchQuery) => set({ searchQuery, selectedIndex: 0 }),

  setRiderText: (riderText) => set({ riderText }),

  promotePrompt: (prompt) =>
    set({
      mode: 'rider',
      promotedPrompt: prompt,
      searchQuery: '',
      riderText: '',
    }),

  clearPromotion: () =>
    set({
      mode: 'search',
      promotedPrompt: null,
      riderText: '',
    }),

  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

  moveSelection: (delta) =>
    set((state) => {
      const maxIndex = state.results.length - 1;
      let newIndex = state.selectedIndex + delta;
      if (newIndex < 0) newIndex = 0;
      if (newIndex > maxIndex) newIndex = maxIndex;
      return { selectedIndex: newIndex };
    }),

  setResults: (results) => set({ results, selectedIndex: 0 }),

  setVisible: (isVisible) => set({ isVisible }),

  reset: () => set(initialState),
}));
