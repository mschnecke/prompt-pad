import { create } from 'zustand';
import { loadIndex as loadIndexFromStorage } from '../utils/storage';
import type { Prompt, PromptIndex } from '../types';

interface PromptState {
  prompts: Prompt[];
  folders: string[];
  tags: string[];
  isLoading: boolean;
  error: string | null;

  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  incrementUsage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadIndex: (index: PromptIndex) => void;
  loadPrompts: () => Promise<void>;
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: [],
  folders: [],
  tags: [],
  isLoading: false,
  error: null,

  setPrompts: (prompts) => {
    const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
    const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
    set({ prompts, folders, tags });
  },

  addPrompt: (prompt) =>
    set((state) => {
      const prompts = [...state.prompts, prompt];
      const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
      const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
      return { prompts, folders, tags };
    }),

  updatePrompt: (id, updates) =>
    set((state) => {
      const prompts = state.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
      const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
      return { prompts, folders, tags };
    }),

  deletePrompt: (id) =>
    set((state) => {
      const prompts = state.prompts.filter((p) => p.id !== id);
      const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
      const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
      return { prompts, folders, tags };
    }),

  incrementUsage: (id) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, useCount: p.useCount + 1, lastUsedAt: new Date() } : p
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  loadIndex: (index) => {
    const prompts = index.prompts;
    const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
    const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
    set({ prompts, folders, tags, isLoading: false });
  },

  loadPrompts: async () => {
    set({ isLoading: true });
    try {
      const index = await loadIndexFromStorage();
      const prompts = index.prompts;
      const folders = [...new Set(prompts.map((p) => p.folder).filter(Boolean) as string[])];
      const tags = [...new Set(prompts.flatMap((p) => p.tags || []))];
      set({ prompts, folders, tags, isLoading: false, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load prompts',
        isLoading: false,
      });
    }
  },
}));
