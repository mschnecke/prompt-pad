import { useMemo, useState, useEffect, useRef } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';
import type { PromptMetadata } from '../tauri/types';

interface SearchOptions {
  debounceMs?: number;
}

interface ScoredResult {
  item: PromptMetadata;
  fuseScore: number;
  usageScore: number;
  recencyScore: number;
  finalScore: number;
}

// Fuse.js configuration with tiered key weights
const fuseOptions: IFuseOptions<PromptMetadata> = {
  // Include score for custom ranking
  includeScore: true,
  // Threshold for fuzzy matching (0 = exact, 1 = match anything)
  threshold: 0.4,
  // Minimum characters before matching starts
  minMatchCharLength: 1,
  // Use extended search for better matching
  useExtendedSearch: false,
  // Ignore field length normalization for short fields
  ignoreFieldNorm: false,
  // Keys with weights (higher = more important)
  keys: [
    { name: 'name', weight: 0.5 },           // Highest priority: name
    { name: 'tags', weight: 0.25 },          // Medium priority: tags
    { name: 'folder', weight: 0.15 },        // Medium priority: folder
    { name: 'description', weight: 0.1 },    // Lower priority: description
  ],
};

/**
 * Calculate usage score (0-1) based on use count
 * Uses logarithmic scaling to prevent very high use counts from dominating
 */
function calculateUsageScore(useCount: number, maxUseCount: number): number {
  if (maxUseCount === 0) return 0;
  // Log scale: log(1 + useCount) / log(1 + maxUseCount)
  return Math.log(1 + useCount) / Math.log(1 + maxUseCount);
}

/**
 * Calculate recency score (0-1) based on last used time
 * More recent = higher score, with exponential decay
 */
function calculateRecencyScore(lastUsedAt: string | null): number {
  if (!lastUsedAt) return 0;

  const lastUsed = new Date(lastUsedAt).getTime();
  const now = Date.now();
  const daysSinceUsed = (now - lastUsed) / (1000 * 60 * 60 * 24);

  // Exponential decay: score halves every 7 days
  const halfLife = 7;
  return Math.exp(-daysSinceUsed / halfLife * Math.LN2);
}

/**
 * Calculate final combined score
 * Formula: (fuseScore × 0.6) + (usageScore × 0.3) + (recencyScore × 0.1)
 * Note: Fuse score is inverted (0 = best match, 1 = worst)
 */
function calculateFinalScore(
  fuseScore: number,
  usageScore: number,
  recencyScore: number
): number {
  // Invert fuse score so higher = better
  const normalizedFuseScore = 1 - fuseScore;
  return normalizedFuseScore * 0.6 + usageScore * 0.3 + recencyScore * 0.1;
}

/**
 * Hook for fuzzy searching prompts with debouncing and custom scoring
 */
export function useFuzzySearch(
  prompts: PromptMetadata[],
  query: string,
  options: SearchOptions = {}
) {
  const { debounceMs = 50 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debounceMs]);

  // Create Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(prompts, fuseOptions);
  }, [prompts]);

  // Calculate max use count for normalization
  const maxUseCount = useMemo(() => {
    return Math.max(...prompts.map((p) => p.useCount), 1);
  }, [prompts]);

  // Perform search and apply custom scoring
  const results = useMemo(() => {
    // If no query, return all prompts sorted by usage + recency
    if (!debouncedQuery.trim()) {
      const scored: ScoredResult[] = prompts.map((item) => {
        const usageScore = calculateUsageScore(item.useCount, maxUseCount);
        const recencyScore = calculateRecencyScore(item.lastUsedAt);
        // For no-query results, use only usage and recency
        const finalScore = usageScore * 0.7 + recencyScore * 0.3;

        return {
          item,
          fuseScore: 0,
          usageScore,
          recencyScore,
          finalScore,
        };
      });

      // Sort by final score (descending)
      scored.sort((a, b) => b.finalScore - a.finalScore);
      return scored.map((s) => s.item);
    }

    // Perform fuzzy search
    const fuseResults = fuse.search(debouncedQuery);

    // Apply custom scoring
    const scored: ScoredResult[] = fuseResults.map((result) => {
      const item = result.item;
      const fuseScore = result.score ?? 0;
      const usageScore = calculateUsageScore(item.useCount, maxUseCount);
      const recencyScore = calculateRecencyScore(item.lastUsedAt);
      const finalScore = calculateFinalScore(fuseScore, usageScore, recencyScore);

      return {
        item,
        fuseScore,
        usageScore,
        recencyScore,
        finalScore,
      };
    });

    // Sort by final score (descending)
    scored.sort((a, b) => b.finalScore - a.finalScore);
    return scored.map((s) => s.item);
  }, [debouncedQuery, fuse, prompts, maxUseCount]);

  return {
    results,
    isSearching: query !== debouncedQuery,
  };
}
