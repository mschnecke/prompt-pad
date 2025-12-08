import { loadSettings, loadIndex, ensureStorageDirectory } from './storage';
import { registerGlobalShortcut } from './shortcuts';
import { useAppStore } from '../stores/appStore';
import { usePromptStore } from '../stores/promptStore';

export async function initializeApp(): Promise<void> {
  try {
    // Ensure storage directory exists
    await ensureStorageDirectory();

    // Load settings
    const settings = await loadSettings();
    useAppStore.getState().setSettings(settings);

    // Apply theme
    applyTheme(settings.theme);

    // Load prompt index
    const index = await loadIndex();
    usePromptStore.getState().loadIndex(index);

    // Register global shortcut
    await registerGlobalShortcut(settings.hotkey);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
