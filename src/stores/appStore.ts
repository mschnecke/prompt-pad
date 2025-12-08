import { create } from 'zustand';
import type { PromptMetadata } from '../lib/tauri/types';

export type { PromptMetadata };

export type ViewMode = 'launcher' | 'editor' | 'settings';

interface AppState {
  // View state
  viewMode: ViewMode;
  editingPrompt: PromptMetadata | null;

  // Search state
  searchQuery: string;
  selectedIndex: number;
  results: PromptMetadata[];

  // Rider mode state
  promotedPrompt: PromptMetadata | null;
  riderText: string;
  isRiderMode: boolean;

  // View actions
  openEditor: (prompt?: PromptMetadata | null) => void;
  closEditor: () => void;
  openSettings: () => void;
  closeSettings: () => void;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  setResults: (results: PromptMetadata[]) => void;
  selectNext: () => void;
  selectPrevious: () => void;

  // Rider mode actions
  promoteSelectedPrompt: () => void;
  setRiderText: (text: string) => void;
  clearPromotion: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  viewMode: 'launcher' as ViewMode,
  editingPrompt: null as PromptMetadata | null,
  searchQuery: '',
  selectedIndex: 0,
  results: [] as PromptMetadata[],
  promotedPrompt: null as PromptMetadata | null,
  riderText: '',
  isRiderMode: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  openEditor: (prompt = null) => set({ viewMode: 'editor', editingPrompt: prompt }),

  closEditor: () => set({ viewMode: 'launcher', editingPrompt: null }),

  openSettings: () => set({ viewMode: 'settings' }),

  closeSettings: () => set({ viewMode: 'launcher' }),

  setSearchQuery: (query) => set({ searchQuery: query, selectedIndex: 0 }),

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setResults: (results) => set({ results, selectedIndex: 0 }),

  selectNext: () => {
    const { selectedIndex, results } = get();
    if (selectedIndex < results.length - 1) {
      set({ selectedIndex: selectedIndex + 1 });
    }
  },

  selectPrevious: () => {
    const { selectedIndex } = get();
    if (selectedIndex > 0) {
      set({ selectedIndex: selectedIndex - 1 });
    }
  },

  promoteSelectedPrompt: () => {
    const { results, selectedIndex } = get();
    const prompt = results[selectedIndex];
    if (prompt) {
      set({
        promotedPrompt: prompt,
        isRiderMode: true,
        searchQuery: '',
        results: [],
      });
    }
  },

  setRiderText: (text) => set({ riderText: text }),

  clearPromotion: () => set({
    promotedPrompt: null,
    riderText: '',
    isRiderMode: false,
  }),

  reset: () => set(initialState),
}));
