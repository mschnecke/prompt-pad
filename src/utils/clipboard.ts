import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';

let savedClipboardContent: string | null = null;

export async function copyToClipboard(text: string): Promise<void> {
  await writeText(text);
}

export async function saveClipboard(): Promise<void> {
  try {
    savedClipboardContent = await readText();
  } catch {
    savedClipboardContent = null;
  }
}

export async function restoreClipboard(): Promise<void> {
  if (savedClipboardContent !== null) {
    await writeText(savedClipboardContent);
    savedClipboardContent = null;
  }
}

export async function pasteAndRestore(text: string, preserveClipboard: boolean): Promise<void> {
  if (preserveClipboard) {
    await saveClipboard();
  }

  await copyToClipboard(text);

  // Note: Actual paste simulation (Cmd/Ctrl+V) will be handled by Tauri commands
  // after focus is restored to the previous application

  if (preserveClipboard) {
    // Delay restoration to allow paste to complete
    setTimeout(async () => {
      await restoreClipboard();
    }, 500);
  }
}
