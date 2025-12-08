import { homeDir, join } from '@tauri-apps/api/path';
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
  rename,
} from '@tauri-apps/plugin-fs';
import type { Prompt, PromptContent, PromptIndex, PromptFrontmatter, Settings } from '../types';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';

const STORAGE_DIR_NAME = 'PromptPad';
const PROMPTS_DIR_NAME = 'prompts';
const INDEX_FILE_NAME = 'index.json';
const SETTINGS_FILE_NAME = 'settings.json';

let storageBasePath: string | null = null;

export async function getStoragePath(): Promise<string> {
  if (storageBasePath) return storageBasePath;
  const home = await homeDir();
  storageBasePath = await join(home, STORAGE_DIR_NAME);
  return storageBasePath;
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
  const basePath = await getStoragePath();
  const settingsPath = await join(basePath, SETTINGS_FILE_NAME);

  const defaultSettings: Settings = {
    hotkey: navigator.platform.includes('Mac') ? 'Command+Shift+P' : 'Control+Shift+P',
    launchAtStartup: false,
    theme: 'system',
    storageLocation: basePath,
    preserveClipboard: false,
  };

  if (!(await exists(settingsPath))) {
    await saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const content = await readTextFile(settingsPath);
    return { ...defaultSettings, ...JSON.parse(content) };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const basePath = await getStoragePath();
  const settingsPath = await join(basePath, SETTINGS_FILE_NAME);
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

          prompts.push({
            id: crypto.randomUUID(),
            name: frontmatter.name || entry.name.replace('.md', ''),
            description: frontmatter.description,
            folder: folder || 'uncategorized',
            tags: frontmatter.tags || [],
            filePath: entryPath.replace(promptsBase + '/', ''),
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
  const filePath = await join(promptsPath, prompt.filePath);
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

  const filePath = await join(promptsPath, prompt.filePath);
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
  const fullPath = await join(promptsPath, filePath);
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
