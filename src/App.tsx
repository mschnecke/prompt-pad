import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { Launcher } from './components/Launcher';
import { PromptManager } from './components/PromptManager';
import { Settings } from './components/Settings';
import { useAppStore } from './stores/appStore';
import { useLauncherStore } from './stores/launcherStore';
import { initializeApp } from './utils/initialize';

type View = 'launcher' | 'manager' | 'settings';

function App() {
  const { isInitialized, setInitialized } = useAppStore();
  const { isVisible, setVisible, reset } = useLauncherStore();
  const [currentView, setCurrentView] = useState<View>('launcher');

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        // Still set initialized to show the UI
        setInitialized(true);
      }
    };
    init();
  }, [setInitialized]);

  // Listen for Tauri window visibility events
  useEffect(() => {
    const window = getCurrentWindow();

    const setupListeners = async () => {
      // Listen for window focus
      const unlistenFocus = await window.onFocusChanged(({ payload: focused }) => {
        if (focused) {
          setVisible(true);
        }
      });

      // Listen for window close request (Escape key from backend)
      const unlistenClose = await window.onCloseRequested(async (event) => {
        event.preventDefault();
        await window.hide();
        setVisible(false);
        reset();
      });

      return () => {
        unlistenFocus();
        unlistenClose();
      };
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [setVisible, reset]);

  // Listen for keyboard shortcuts to open manager/settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + , for settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setCurrentView('settings');
      }
      // Cmd/Ctrl + M for manager
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setCurrentView('manager');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for tray menu events
  useEffect(() => {
    const unlistenSettings = listen('open-settings', () => {
      setCurrentView('settings');
    });
    const unlistenManager = listen('open-manager', () => {
      setCurrentView('manager');
    });

    return () => {
      unlistenSettings.then(fn => fn());
      unlistenManager.then(fn => fn());
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-primary-500 rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-white">P</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400">Loading PromptPad...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Launcher - only show when in launcher view */}
      {currentView === 'launcher' && (
        <Launcher
          onOpenManager={() => setCurrentView('manager')}
          onOpenSettings={() => setCurrentView('settings')}
        />
      )}

      {/* Manager Modal */}
      {currentView === 'manager' && (
        <PromptManager onClose={() => setCurrentView('launcher')} />
      )}

      {/* Settings Modal */}
      {currentView === 'settings' && (
        <Settings onClose={() => setCurrentView('launcher')} />
      )}

      {/* Empty state when launcher is hidden and in launcher view */}
      {!isVisible && currentView === 'launcher' && (
        <div className="flex flex-col items-center justify-center h-screen bg-transparent">
          <div className="text-center p-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg backdrop-blur">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              PromptPad
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Press the hotkey to open the launcher
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setCurrentView('manager')}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Manage Prompts
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
