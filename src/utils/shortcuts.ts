import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useLauncherStore } from '../stores/launcherStore';

let currentShortcut: string | null = null;

export async function registerGlobalShortcut(shortcut: string): Promise<void> {
  // Unregister existing shortcut if any
  if (currentShortcut && (await isRegistered(currentShortcut))) {
    await unregister(currentShortcut);
  }

  // Register new shortcut
  await register(shortcut, async (event) => {
    if (event.state === 'Pressed') {
      await toggleLauncher();
    }
  });

  currentShortcut = shortcut;
}

export async function unregisterGlobalShortcut(): Promise<void> {
  if (currentShortcut && (await isRegistered(currentShortcut))) {
    await unregister(currentShortcut);
    currentShortcut = null;
  }
}

async function toggleLauncher(): Promise<void> {
  const store = useLauncherStore.getState();
  const window = getCurrentWindow();
  const isVisible = await window.isVisible();

  if (isVisible) {
    await invoke('hide_launcher');
    store.setVisible(false);
    store.reset();
  } else {
    await invoke('show_launcher');
    store.setVisible(true);
  }
}
