// Core data types for PromptPad

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  folder?: string;
  tags: string[];
  filePath: string;
  useCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface PromptContent extends Prompt {
  content: string;
}

export interface PromptIndex {
  version: number;
  prompts: Prompt[];
  lastUpdated: Date;
}

export interface Settings {
  hotkey: string;
  launchAtStartup: boolean;
  theme: Theme;
  storageLocation: string;
  preserveClipboard: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export interface SearchResult {
  prompt: Prompt;
  score: number;
  matches?: {
    field: string;
    indices: [number, number][];
  }[];
}

export type LauncherMode = 'search' | 'rider';

export interface LauncherState {
  mode: LauncherMode;
  searchQuery: string;
  riderText: string;
  promotedPrompt: Prompt | null;
  selectedIndex: number;
  results: SearchResult[];
}

// Frontmatter parsed from prompt .md files
export interface PromptFrontmatter {
  name: string;
  description?: string;
  tags?: string[];
  created?: string;
}
