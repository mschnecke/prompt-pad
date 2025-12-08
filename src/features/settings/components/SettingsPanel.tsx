import { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor, Keyboard, Info, Folder } from 'lucide-react';
import { getSettings, updateSettings } from '../../../lib/tauri/commands';
import type { Settings } from '../../../lib/tauri/types';

interface SettingsPanelProps {
  onClose: () => void;
}

type Tab = 'general' | 'appearance' | 'shortcuts' | 'about';

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newSettings: Partial<Settings>) => {
    if (!settings) return;

    const updated = { ...settings, ...newSettings };
    setIsSaving(true);

    try {
      await updateSettings(updated);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Folder className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col absolute inset-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-40 border-r border-border p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <>
              {activeTab === 'general' && (
                <GeneralTab settings={settings} onSave={handleSave} isSaving={isSaving} />
              )}
              {activeTab === 'appearance' && (
                <AppearanceTab settings={settings} onSave={handleSave} isSaving={isSaving} />
              )}
              {activeTab === 'shortcuts' && <ShortcutsTab />}
              {activeTab === 'about' && <AboutTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// General Tab
function GeneralTab({
  settings,
  onSave,
  isSaving,
}: {
  settings: Settings | null;
  onSave: (s: Partial<Settings>) => void;
  isSaving: boolean;
}) {
  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Startup</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.launchAtStartup}
            onChange={(e) => onSave({ launchAtStartup: e.target.checked })}
            disabled={isSaving}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Launch at system startup</span>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Clipboard</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.preserveClipboard}
            onChange={(e) => onSave({ preserveClipboard: e.target.checked })}
            disabled={isSaving}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Preserve clipboard history</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          Keep previous clipboard content after pasting a prompt
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Storage</h3>
        <div className="text-sm text-muted-foreground">
          Prompts are stored in: <code className="bg-muted px-1 rounded">~/PromptPad/</code>
        </div>
      </div>
    </div>
  );
}

// Appearance Tab
function AppearanceTab({
  settings,
  onSave,
  isSaving,
}: {
  settings: Settings | null;
  onSave: (s: Partial<Settings>) => void;
  isSaving: boolean;
}) {
  if (!settings) return null;

  const themes = [
    { id: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSave({ theme: theme.id })}
              disabled={isSaving}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                settings.theme === theme.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {theme.icon}
              <span className="text-sm">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shortcuts Tab
function ShortcutsTab() {
  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'Shift', 'Space'], action: 'Toggle launcher' },
    { keys: ['↑', '↓'], action: 'Navigate results' },
    { keys: ['Tab', 'Space'], action: 'Promote prompt (rider mode)' },
    { keys: ['Enter'], action: 'Paste prompt' },
    { keys: ['Esc'], action: 'Close / Cancel' },
    { keys: ['Cmd/Ctrl', 'S'], action: 'Save (in editor)' },
    { keys: ['Backspace'], action: 'Clear promotion (when empty)' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{shortcut.action}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, j) => (
                <kbd
                  key={j}
                  className="px-2 py-1 text-xs bg-muted rounded border border-border"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// About Tab
function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-1">PromptPad</h3>
        <p className="text-sm text-muted-foreground">Version 0.1.0</p>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          A Spotlight-style prompt launcher for quickly accessing and pasting your
          favorite prompts with optional context.
        </p>
        <p>
          Built with Tauri, React, and TypeScript.
        </p>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Made with care by Pisum Projects
        </p>
      </div>
    </div>
  );
}
