/**
 * Tauri command bindings for the Rust backend
 */
import { invoke } from '@tauri-apps/api/core';
import type {
  PromptMetadata,
  PromptIndex,
  Settings,
  CreatePromptInput,
  UpdatePromptInput,
} from './types';

// ============ Window Commands ============

export async function showLauncher(): Promise<void> {
  return invoke('show_launcher');
}

export async function hideLauncher(): Promise<void> {
  return invoke('hide_launcher');
}

/**
 * Hide launcher and paste clipboard content to the previously focused app
 * Returns true if paste was successful
 */
export async function pasteAndHide(): Promise<boolean> {
  return invoke('paste_and_hide');
}

// ============ Prompt Commands ============

export async function getPromptIndex(): Promise<PromptIndex> {
  return invoke('get_prompt_index');
}

export async function rebuildPromptIndex(): Promise<PromptIndex> {
  return invoke('rebuild_prompt_index');
}

export async function createPrompt(input: CreatePromptInput): Promise<PromptMetadata> {
  return invoke('create_prompt', { input });
}

export async function updatePrompt(id: string, input: UpdatePromptInput): Promise<PromptMetadata> {
  return invoke('update_prompt', { id, input });
}

export async function deletePrompt(id: string): Promise<void> {
  return invoke('delete_prompt', { id });
}

export async function getPromptContent(id: string): Promise<string> {
  return invoke('get_prompt_content', { id });
}

export async function recordPromptUsage(id: string): Promise<void> {
  return invoke('record_prompt_usage', { id });
}

// ============ Folder Commands ============

export async function createFolder(name: string): Promise<void> {
  return invoke('create_folder', { name });
}

export async function listFolders(): Promise<string[]> {
  return invoke('list_folders');
}

// ============ Settings Commands ============

export async function getSettings(): Promise<Settings> {
  return invoke('get_settings');
}

export async function updateSettings(newSettings: Settings): Promise<Settings> {
  return invoke('update_settings', { newSettings });
}

// ============ Search Commands ============

export async function searchPromptContent(query: string): Promise<PromptMetadata[]> {
  return invoke('search_prompt_content', { query });
}
