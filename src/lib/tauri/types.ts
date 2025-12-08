/**
 * TypeScript types that mirror the Rust models
 * Note: Rust uses snake_case, but Tauri's serde automatically converts to camelCase
 */

export interface PromptMetadata {
  id: string;
  name: string;
  description: string | null;
  folder: string | null;
  tags: string[];
  filePath: string;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface PromptIndex {
  version: number;
  updatedAt: string;
  prompts: PromptMetadata[];
  folders: string[];
  tags: string[];
}

export interface Settings {
  hotkey: string;
  theme: string;
  storageLocation: string | null;
  launchAtStartup: boolean;
  preserveClipboard: boolean;
}

export interface CreatePromptInput {
  name: string;
  content: string;
  description?: string | null;
  folder?: string | null;
  tags?: string[];
}

export interface UpdatePromptInput {
  name?: string | null;
  content?: string | null;
  description?: string | null;
  folder?: string | null;
  tags?: string[] | null;
}
