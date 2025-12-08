import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { useLauncherStore } from '../stores/launcherStore';

let currentShortcut: string | null = null;

export async function registerGlobalShortcut(shortcut: string): Promise<void> {
  // Unregister existing shortcut if any
  if (currentShortcut && (await isRegistered(currentShortcut))) {
    await unregister(currentShortcut);
  }

  // Register new shortcut
  await register(shortcut, (event) => {
    if (event.state === 'Pressed') {
      toggleLauncher();
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

function toggleLauncher(): void {
  const store = useLauncherStore.getState();
  if (store.isVisible) {
    store.setVisible(false);
    store.reset();
  } else {
    store.setVisible(true);
  }
}
