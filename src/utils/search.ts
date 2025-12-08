import Fuse, { IFuseOptions } from 'fuse.js';
import type { Prompt, SearchResult } from '../types';

let fuseInstance: Fuse<Prompt> | null = null;

const FUSE_OPTIONS: IFuseOptions<Prompt> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'tags', weight: 0.25 },
    { name: 'folder', weight: 0.15 },
    { name: 'description', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  minMatchCharLength: 1,
};

export function initializeSearch(prompts: Prompt[]): void {
  fuseInstance = new Fuse(prompts, FUSE_OPTIONS);
}

export function updateSearchIndex(prompts: Prompt[]): void {
  if (fuseInstance) {
    fuseInstance.setCollection(prompts);
  } else {
    initializeSearch(prompts);
  }
}

export function searchPrompts(query: string, prompts: Prompt[]): SearchResult[] {
  if (!query.trim()) {
    // Return all prompts sorted by usage when no query
    return prompts
      .map((prompt) => ({
        prompt,
        score: calculateUsageScore(prompt),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  if (!fuseInstance) {
    initializeSearch(prompts);
  }

  const fuseResults = fuseInstance!.search(query);

  return fuseResults.map((result) => ({
    prompt: result.item,
    score: combineScores(1 - (result.score || 0), calculateUsageScore(result.item)),
    matches: result.matches?.map((m) => ({
      field: m.key || '',
      indices: m.indices as [number, number][],
    })),
  }));
}

function calculateUsageScore(prompt: Prompt): number {
  const useCountScore = Math.min(prompt.useCount * 0.1, 5); // Cap at 5 points from usage

  let recencyBonus = 0;
  if (prompt.lastUsedAt) {
    const daysSinceUsed = (Date.now() - prompt.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
    recencyBonus = Math.max(0, 10 - daysSinceUsed); // Decays over 10 days
  }

  return useCountScore + recencyBonus;
}

function combineScores(matchScore: number, usageScore: number): number {
  // Weight match score more heavily, but boost by usage
  return matchScore * 100 + usageScore;
}
