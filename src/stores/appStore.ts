import { create } from 'zustand';
import type { Settings, Theme } from '../types';

interface AppState {
  isInitialized: boolean;
  settings: Settings;
  setInitialized: (value: boolean) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setTheme: (theme: Theme) => void;
}

const defaultSettings: Settings = {
  hotkey: 'CommandOrControl+Shift+P',
  launchAtStartup: false,
  theme: 'system',
  storageLocation: '',
  preserveClipboard: false,
};

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  settings: defaultSettings,

  setInitialized: (value) => set({ isInitialized: value }),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setTheme: (theme) =>
    set((state) => ({
      settings: { ...state.settings, theme },
    })),
}));
