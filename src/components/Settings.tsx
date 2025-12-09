import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../stores/appStore';
import { saveSettings, getStoragePath, rebuildIndex, changeStorageLocation } from '../utils/storage';
import { registerGlobalShortcut } from '../utils/shortcuts';
import type { Theme } from '../types';

interface SettingsProps {
  onClose: () => void;
}

type Tab = 'general' | 'appearance' | 'storage' | 'about';

export function Settings({ onClose }: SettingsProps) {
  const { settings, setSettings, setTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [storagePath, setStoragePath] = useState('');
  const [isRebuildingIndex, setIsRebuildingIndex] = useState(false);
  const [hotkeyInput, setHotkeyInput] = useState(settings.hotkey);
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [isChangingStorage, setIsChangingStorage] = useState(false);

  useEffect(() => {
    // Use settings.storageLocation if available, otherwise get default
    if (settings.storageLocation) {
      setStoragePath(settings.storageLocation);
    } else {
      getStoragePath().then(setStoragePath);
    }
  }, [settings.storageLocation]);

  const handleChangeStorageLocation = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Storage Location',
      });

      console.log('Selected folder:', selected);

      if (selected && typeof selected === 'string') {
        setIsChangingStorage(true);
        try {
          await changeStorageLocation(selected);
          setStoragePath(selected);
          const newSettings = { ...settings, storageLocation: selected };
          setSettings(newSettings);
          await saveSettings(newSettings);
          console.log('Storage location changed to:', selected);
        } catch (err) {
          console.error('Failed to change storage location:', err);
          alert('Failed to change storage location: ' + (err as Error).message);
        } finally {
          setIsChangingStorage(false);
        }
      }
    } catch (err) {
      console.error('Failed to open folder picker:', err);
      alert('Failed to open folder picker: ' + (err as Error).message);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    saveSettings({ ...settings, theme });

    // Apply theme
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleHotkeyRecord = (e: React.KeyboardEvent) => {
    if (!isRecordingHotkey) return;

    e.preventDefault();
    const parts: string[] = [];

    if (e.metaKey) parts.push('Command');
    if (e.ctrlKey) parts.push('Control');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const key = e.key;
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
      const hotkey = parts.join('+');
      setHotkeyInput(hotkey);
      setIsRecordingHotkey(false);
    }
  };

  const handleSaveHotkey = async () => {
    try {
      await registerGlobalShortcut(hotkeyInput);
      const newSettings = { ...settings, hotkey: hotkeyInput };
      setSettings(newSettings);
      await saveSettings(newSettings);
    } catch (err) {
      console.error('Failed to register hotkey:', err);
    }
  };

  const handleRebuildIndex = async () => {
    setIsRebuildingIndex(true);
    try {
      await rebuildIndex();
    } finally {
      setIsRebuildingIndex(false);
    }
  };

  const handleToggleAutostart = async (enabled: boolean) => {
    const newSettings = { ...settings, launchAtStartup: enabled };
    setSettings(newSettings);
    await saveSettings(newSettings);
    // Note: Actual autostart toggle would need Tauri command
  };

  const handleToggleClipboard = async (enabled: boolean) => {
    const newSettings = { ...settings, preserveClipboard: enabled };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'storage', label: 'Storage' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full h-full flex"
      >
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Settings</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Hotkey */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Global Hotkey
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hotkeyInput}
                      onKeyDown={handleHotkeyRecord}
                      onFocus={() => setIsRecordingHotkey(true)}
                      onBlur={() => setIsRecordingHotkey(false)}
                      readOnly
                      className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        isRecordingHotkey
                          ? 'border-primary-500 ring-2 ring-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Click and press keys..."
                    />
                    <button
                      onClick={handleSaveHotkey}
                      disabled={hotkeyInput === settings.hotkey}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click the field and press your desired key combination
                  </p>
                </div>

                {/* Launch at Startup */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Launch at startup
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Start PromptPad when you log in
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAutostart(!settings.launchAtStartup)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.launchAtStartup ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.launchAtStartup ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Preserve Clipboard */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preserve clipboard
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Restore original clipboard content after pasting
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleClipboard(!settings.preserveClipboard)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.preserveClipboard ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.preserveClipboard ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleThemeChange(theme)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors capitalize ${
                          settings.theme === theme
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {theme}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Location
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                      {storagePath}
                    </div>
                    <button
                      onClick={handleChangeStorageLocation}
                      disabled={isChangingStorage}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isChangingStorage ? 'Moving...' : 'Browse'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Prompts will be moved to the new location
                  </p>
                </div>

                <div>
                  <button
                    onClick={handleRebuildIndex}
                    disabled={isRebuildingIndex}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isRebuildingIndex ? 'Rebuilding...' : 'Rebuild Index'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Scan prompts folder and rebuild the search index
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    PromptPad
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Version 1.0.0
                  </p>
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>A Spotlight-style prompt launcher for Windows & macOS</p>
                  <p className="mt-4">
                    Press{' '}
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {settings.hotkey}
                    </kbd>{' '}
                    to open the launcher
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
