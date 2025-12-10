import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useAppStore.setState({
      isInitialized: false,
      settings: {
        hotkey: 'CommandOrControl+Shift+P',
        launchAtStartup: false,
        theme: 'system',
        storageLocation: '',
        preserveClipboard: false,
      },
    });
  });

  describe('initial state', () => {
    it('starts uninitialized', () => {
      expect(useAppStore.getState().isInitialized).toBe(false);
    });

    it('has default hotkey', () => {
      expect(useAppStore.getState().settings.hotkey).toBe('CommandOrControl+Shift+P');
    });

    it('has default theme as system', () => {
      expect(useAppStore.getState().settings.theme).toBe('system');
    });

    it('has launch at startup disabled', () => {
      expect(useAppStore.getState().settings.launchAtStartup).toBe(false);
    });

    it('has preserve clipboard disabled', () => {
      expect(useAppStore.getState().settings.preserveClipboard).toBe(false);
    });
  });

  describe('setInitialized', () => {
    it('sets initialized to true', () => {
      useAppStore.getState().setInitialized(true);
      expect(useAppStore.getState().isInitialized).toBe(true);
    });

    it('sets initialized to false', () => {
      useAppStore.setState({ isInitialized: true });
      useAppStore.getState().setInitialized(false);
      expect(useAppStore.getState().isInitialized).toBe(false);
    });
  });

  describe('setSettings', () => {
    it('updates a single setting', () => {
      useAppStore.getState().setSettings({ launchAtStartup: true });

      const settings = useAppStore.getState().settings;
      expect(settings.launchAtStartup).toBe(true);
      // Other settings should remain unchanged
      expect(settings.hotkey).toBe('CommandOrControl+Shift+P');
      expect(settings.theme).toBe('system');
    });

    it('updates multiple settings', () => {
      useAppStore.getState().setSettings({
        launchAtStartup: true,
        preserveClipboard: true,
        storageLocation: '/custom/path',
      });

      const settings = useAppStore.getState().settings;
      expect(settings.launchAtStartup).toBe(true);
      expect(settings.preserveClipboard).toBe(true);
      expect(settings.storageLocation).toBe('/custom/path');
    });

    it('updates hotkey', () => {
      useAppStore.getState().setSettings({ hotkey: 'CommandOrControl+Shift+L' });
      expect(useAppStore.getState().settings.hotkey).toBe('CommandOrControl+Shift+L');
    });

    it('preserves existing settings not in update', () => {
      useAppStore.setState({
        settings: {
          hotkey: 'Custom+Key',
          launchAtStartup: true,
          theme: 'dark',
          storageLocation: '/custom',
          preserveClipboard: true,
        },
      });

      useAppStore.getState().setSettings({ theme: 'light' });

      const settings = useAppStore.getState().settings;
      expect(settings.hotkey).toBe('Custom+Key');
      expect(settings.launchAtStartup).toBe(true);
      expect(settings.theme).toBe('light');
      expect(settings.storageLocation).toBe('/custom');
      expect(settings.preserveClipboard).toBe(true);
    });
  });

  describe('setTheme', () => {
    it('sets theme to light', () => {
      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().settings.theme).toBe('light');
    });

    it('sets theme to dark', () => {
      useAppStore.getState().setTheme('dark');
      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('sets theme to system', () => {
      useAppStore.setState({
        settings: { ...useAppStore.getState().settings, theme: 'dark' },
      });
      useAppStore.getState().setTheme('system');
      expect(useAppStore.getState().settings.theme).toBe('system');
    });

    it('preserves other settings when setting theme', () => {
      useAppStore.setState({
        settings: {
          hotkey: 'Custom+Key',
          launchAtStartup: true,
          theme: 'light',
          storageLocation: '/custom',
          preserveClipboard: true,
        },
      });

      useAppStore.getState().setTheme('dark');

      const settings = useAppStore.getState().settings;
      expect(settings.hotkey).toBe('Custom+Key');
      expect(settings.launchAtStartup).toBe(true);
      expect(settings.storageLocation).toBe('/custom');
      expect(settings.preserveClipboard).toBe(true);
    });
  });

  describe('settings persistence scenarios', () => {
    it('simulates loading settings from storage', () => {
      // Simulate loading stored settings
      const loadedSettings = {
        hotkey: 'CommandOrControl+Space',
        launchAtStartup: true,
        theme: 'dark' as const,
        storageLocation: '/Users/test/.prompt-pad',
        preserveClipboard: true,
      };

      useAppStore.getState().setSettings(loadedSettings);
      useAppStore.getState().setInitialized(true);

      const state = useAppStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.settings).toEqual(loadedSettings);
    });

    it('simulates user changing theme in settings', () => {
      // Initialize with defaults
      useAppStore.getState().setInitialized(true);

      // User changes theme
      useAppStore.getState().setTheme('dark');
      expect(useAppStore.getState().settings.theme).toBe('dark');

      // User changes theme again
      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().settings.theme).toBe('light');
    });
  });
});
