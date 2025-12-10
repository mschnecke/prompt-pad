import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';
import { getPromptsPath, saveIndex, loadIndex } from './storage';
import { join } from '@tauri-apps/api/path';
import { writeTextFile, readTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import type { Prompt, PromptFrontmatter } from '../types';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export async function importMarkdownFile(
  fileName: string,
  content: string,
  folder: string = 'uncategorized'
): Promise<Prompt> {
  const { frontmatter, content: promptContent } = parseFrontmatter(content);

  const now = new Date();
  const id = crypto.randomUUID();
  const name = frontmatter.name || fileName.replace(/\.md$/i, '');
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filePath = `${folder}/${sanitizedName}.md`;

  const promptsPath = await getPromptsPath();
  const folderPath = await join(promptsPath, folder);
  const fullPath = await join(promptsPath, filePath);

  // Ensure folder exists
  if (!(await exists(folderPath))) {
    await mkdir(folderPath, { recursive: true });
  }

  // Write the file
  const newFrontmatter: PromptFrontmatter = {
    name,
    description: frontmatter.description,
    tags: frontmatter.tags || [],
    created: frontmatter.created || now.toISOString(),
  };

  const fileContent = stringifyFrontmatter(newFrontmatter, promptContent);
  await writeTextFile(fullPath, fileContent);

  const prompt: Prompt = {
    id,
    name,
    description: frontmatter.description,
    folder,
    tags: frontmatter.tags || [],
    filePath,
    useCount: 0,
    createdAt: frontmatter.created ? new Date(frontmatter.created) : now,
  };

  // Update index
  const index = await loadIndex();
  index.prompts.push(prompt);
  index.lastUpdated = now;
  await saveIndex(index);

  return prompt;
}

export interface BulkImportPrompt {
  name: string;
  description?: string;
  content: string;
  folder?: string;
  tags?: string[];
}

export async function importBulkJson(prompts: BulkImportPrompt[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const promptData of prompts) {
    try {
      const content = `---
name: ${promptData.name}
${promptData.description ? `description: ${promptData.description}` : ''}
tags: [${(promptData.tags || []).join(', ')}]
created: ${new Date().toISOString()}
---

${promptData.content}`;

      await importMarkdownFile(promptData.name, content, promptData.folder || 'uncategorized');
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push(`Failed to import "${promptData.name}": ${err}`);
    }
  }

  return result;
}

export interface ExportedPrompt {
  name: string;
  description?: string;
  content: string;
  folder?: string;
  tags: string[];
  useCount: number;
  createdAt: string;
  lastUsedAt?: string;
}

export async function exportToJson(prompts: Prompt[]): Promise<ExportedPrompt[]> {
  const exported: ExportedPrompt[] = [];
  const promptsPath = await getPromptsPath();

  for (const prompt of prompts) {
    try {
      const fullPath = await join(promptsPath, prompt.filePath);
      const fileContent = await readTextFile(fullPath);
      const { content } = parseFrontmatter(fileContent);

      exported.push({
        name: prompt.name,
        description: prompt.description,
        content,
        folder: prompt.folder,
        tags: prompt.tags,
        useCount: prompt.useCount,
        createdAt: prompt.createdAt.toISOString(),
        lastUsedAt: prompt.lastUsedAt?.toISOString(),
      });
    } catch (err) {
      console.warn(`Failed to export "${prompt.name}":`, err);
    }
  }

  return exported;
}

export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
