import { homeDir, join } from '@tauri-apps/api/path';
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
  rename,
  copyFile,
} from '@tauri-apps/plugin-fs';
import type { Prompt, PromptContent, PromptIndex, PromptFrontmatter, Settings } from '../types';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';

const SETTINGS_FILE_NAME = '.prompt-pad.json';
const DEFAULT_STORAGE_DIR = '.prompt-pad';
const PROMPTS_DIR_NAME = 'prompts';
const INDEX_FILE_NAME = 'index.json';

let cachedSettings: Settings | null = null;

// Settings file is always at ~/.prompt-pad.json
async function getSettingsFilePath(): Promise<string> {
  const home = await homeDir();
  return join(home, SETTINGS_FILE_NAME);
}

// Default storage location is ~/.prompt-pad/
async function getDefaultStoragePath(): Promise<string> {
  const home = await homeDir();
  return join(home, DEFAULT_STORAGE_DIR);
}

export async function getStoragePath(): Promise<string> {
  if (cachedSettings?.storageLocation) {
    return cachedSettings.storageLocation;
  }
  return getDefaultStoragePath();
}

export async function getPromptsPath(): Promise<string> {
  const base = await getStoragePath();
  return join(base, PROMPTS_DIR_NAME);
}

export async function ensureStorageDirectory(): Promise<void> {
  const basePath = await getStoragePath();
  const promptsPath = await getPromptsPath();

  if (!(await exists(basePath))) {
    await mkdir(basePath, { recursive: true });
  }

  if (!(await exists(promptsPath))) {
    await mkdir(promptsPath, { recursive: true });
  }

  // Create uncategorized folder
  const uncategorizedPath = await join(promptsPath, 'uncategorized');
  if (!(await exists(uncategorizedPath))) {
    await mkdir(uncategorizedPath, { recursive: true });
  }
}

export async function loadSettings(): Promise<Settings> {
  const settingsPath = await getSettingsFilePath();
  const defaultStoragePath = await getDefaultStoragePath();

  const defaultSettings: Settings = {
    hotkey: 'CommandOrControl+Shift+P',
    launchAtStartup: false,
    theme: 'system',
    storageLocation: defaultStoragePath,
    preserveClipboard: false,
  };

  if (!(await exists(settingsPath))) {
    cachedSettings = defaultSettings;
    await saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const content = await readTextFile(settingsPath);
    const loaded = { ...defaultSettings, ...JSON.parse(content) };
    cachedSettings = loaded;
    return loaded;
  } catch {
    cachedSettings = defaultSettings;
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const settingsPath = await getSettingsFilePath();
  cachedSettings = settings;
  await writeTextFile(settingsPath, JSON.stringify(settings, null, 2));
}

export async function loadIndex(): Promise<PromptIndex> {
  const basePath = await getStoragePath();
  const indexPath = await join(basePath, INDEX_FILE_NAME);

  const emptyIndex: PromptIndex = {
    version: 1,
    prompts: [],
    lastUpdated: new Date(),
  };

  if (!(await exists(indexPath))) {
    // Rebuild index from files
    return rebuildIndex();
  }

  try {
    const content = await readTextFile(indexPath);
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated),
      prompts: parsed.prompts.map((p: Prompt) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastUsedAt: p.lastUsedAt ? new Date(p.lastUsedAt) : undefined,
      })),
    };
  } catch {
    return emptyIndex;
  }
}

export async function saveIndex(index: PromptIndex): Promise<void> {
  const basePath = await getStoragePath();
  const indexPath = await join(basePath, INDEX_FILE_NAME);
  await writeTextFile(indexPath, JSON.stringify(index, null, 2));
}

export async function rebuildIndex(): Promise<PromptIndex> {
  const promptsPath = await getPromptsPath();
  const prompts: Prompt[] = [];

  async function scanDirectory(dirPath: string, folder?: string): Promise<void> {
    if (!(await exists(dirPath))) return;

    const entries = await readDir(dirPath);

    for (const entry of entries) {
      const entryPath = await join(dirPath, entry.name);

      if (entry.isDirectory) {
        await scanDirectory(entryPath, entry.name);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = await readTextFile(entryPath);
          const { frontmatter } = parseFrontmatter(content);
          const promptsBase = await getPromptsPath();

          // Get relative path by removing the base path (handle both / and \ separators)
          const relativePath = entryPath
            .replace(promptsBase, '')
            .replace(/^[/\\]+/, '') // Remove leading slashes
            .replace(/\\/g, '/'); // Normalize to forward slashes

          prompts.push({
            id: crypto.randomUUID(),
            name: frontmatter.name || entry.name.replace('.md', ''),
            description: frontmatter.description,
            folder: folder || 'uncategorized',
            tags: frontmatter.tags || [],
            filePath: relativePath,
            useCount: 0,
            createdAt: frontmatter.created ? new Date(frontmatter.created) : new Date(),
          });
        } catch (error) {
          console.warn(`Failed to parse prompt file: ${entryPath}`, error);
        }
      }
    }
  }

  await scanDirectory(promptsPath);

  const index: PromptIndex = {
    version: 1,
    prompts,
    lastUpdated: new Date(),
  };

  await saveIndex(index);
  return index;
}

export async function loadPromptContent(prompt: Prompt): Promise<PromptContent> {
  const promptsPath = await getPromptsPath();
  // Split the file path by both / and \ to handle cross-platform paths
  const pathParts = prompt.filePath.split(/[/\\]/);
  const filePath = await join(promptsPath, ...pathParts);
  const fileContent = await readTextFile(filePath);
  const { content } = parseFrontmatter(fileContent);

  return {
    ...prompt,
    content,
  };
}

export async function savePrompt(prompt: PromptContent): Promise<void> {
  const promptsPath = await getPromptsPath();
  const folderPath = await join(promptsPath, prompt.folder || 'uncategorized');

  if (!(await exists(folderPath))) {
    await mkdir(folderPath, { recursive: true });
  }

  // Split the file path by both / and \ to handle cross-platform paths
  const pathParts = prompt.filePath.split(/[/\\]/);
  const filePath = await join(promptsPath, ...pathParts);
  const frontmatter: PromptFrontmatter = {
    name: prompt.name,
    description: prompt.description,
    tags: prompt.tags,
    created: prompt.createdAt.toISOString(),
  };

  const fileContent = stringifyFrontmatter(frontmatter, prompt.content);
  await writeTextFile(filePath, fileContent);
}

export async function deletePromptFile(filePath: string): Promise<void> {
  const promptsPath = await getPromptsPath();
  // Split the file path by both / and \ to handle cross-platform paths
  const pathParts = filePath.split(/[/\\]/);
  const fullPath = await join(promptsPath, ...pathParts);
  await remove(fullPath);
}

export async function createFolder(name: string): Promise<void> {
  const promptsPath = await getPromptsPath();
  const folderPath = await join(promptsPath, name);
  await mkdir(folderPath, { recursive: true });
}

export async function renameFolder(oldName: string, newName: string): Promise<void> {
  const promptsPath = await getPromptsPath();
  const oldPath = await join(promptsPath, oldName);
  const newPath = await join(promptsPath, newName);
  await rename(oldPath, newPath);
}

export async function deleteFolder(name: string): Promise<void> {
  const promptsPath = await getPromptsPath();
  const folderPath = await join(promptsPath, name);
  // Move files to uncategorized first, then delete folder
  const uncategorizedPath = await join(promptsPath, 'uncategorized');

  const entries = await readDir(folderPath);
  for (const entry of entries) {
    if (entry.name.endsWith('.md')) {
      const oldPath = await join(folderPath, entry.name);
      const newPath = await join(uncategorizedPath, entry.name);
      await rename(oldPath, newPath);
    }
  }

  await remove(folderPath, { recursive: true });
}

export async function changeStorageLocation(newPath: string): Promise<void> {
  const oldPath = await getStoragePath();

  // Don't do anything if paths are the same
  if (oldPath === newPath) return;

  // Create new directory structure
  const newPromptsPath = await join(newPath, PROMPTS_DIR_NAME);
  const newUncategorizedPath = await join(newPromptsPath, 'uncategorized');

  if (!(await exists(newPath))) {
    await mkdir(newPath, { recursive: true });
  }
  if (!(await exists(newPromptsPath))) {
    await mkdir(newPromptsPath, { recursive: true });
  }
  if (!(await exists(newUncategorizedPath))) {
    await mkdir(newUncategorizedPath, { recursive: true });
  }

  // Copy all prompts recursively
  const oldPromptsPath = await join(oldPath, PROMPTS_DIR_NAME);
  if (await exists(oldPromptsPath)) {
    await copyDirectoryContents(oldPromptsPath, newPromptsPath);
  }

  // Copy index if it exists
  const oldIndexPath = await join(oldPath, INDEX_FILE_NAME);
  if (await exists(oldIndexPath)) {
    const newIndexPath = await join(newPath, INDEX_FILE_NAME);
    await copyFile(oldIndexPath, newIndexPath);
  }

  // Update settings with new storage location
  const settings = await loadSettings();
  settings.storageLocation = newPath;
  await saveSettings(settings);
}

async function copyDirectoryContents(srcDir: string, destDir: string): Promise<void> {
  const entries = await readDir(srcDir);

  for (const entry of entries) {
    const srcPath = await join(srcDir, entry.name);
    const destPath = await join(destDir, entry.name);

    if (entry.isDirectory) {
      if (!(await exists(destPath))) {
        await mkdir(destPath, { recursive: true });
      }
      await copyDirectoryContents(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}
