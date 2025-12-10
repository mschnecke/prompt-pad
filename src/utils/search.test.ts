import { describe, it, expect, beforeEach } from 'vitest';
import { initializeSearch, updateSearchIndex, searchPrompts } from './search';
import type { Prompt } from '../types';

const createPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: crypto.randomUUID(),
  name: 'Test Prompt',
  description: 'A test description',
  folder: 'test-folder',
  tags: ['tag1', 'tag2'],
  filePath: 'test-folder/test-prompt.md',
  useCount: 0,
  createdAt: new Date(),
  ...overrides,
});

describe('search', () => {
  let prompts: Prompt[];

  beforeEach(() => {
    prompts = [
      createPrompt({
        name: 'Code Review',
        description: 'Review code for issues',
        folder: 'coding',
        tags: ['code', 'review'],
        useCount: 10,
        lastUsedAt: new Date(),
      }),
      createPrompt({
        name: 'Bug Fix Template',
        description: 'Template for fixing bugs',
        folder: 'coding',
        tags: ['bug', 'fix', 'template'],
        useCount: 5,
        lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      }),
      createPrompt({
        name: 'Meeting Notes',
        description: 'Template for meeting notes',
        folder: 'work',
        tags: ['meeting', 'notes'],
        useCount: 3,
      }),
      createPrompt({
        name: 'Email Draft',
        description: 'Draft professional emails',
        folder: 'communication',
        tags: ['email', 'draft'],
        useCount: 0,
      }),
    ];

    initializeSearch(prompts);
  });

  describe('initializeSearch', () => {
    it('initializes search index with prompts', () => {
      initializeSearch(prompts);
      const results = searchPrompts('code', prompts);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('updateSearchIndex', () => {
    it('updates search index with new prompts', () => {
      const newPrompts = [...prompts, createPrompt({ name: 'New Prompt', tags: ['new'] })];

      updateSearchIndex(newPrompts);
      const results = searchPrompts('new', newPrompts);

      expect(results.some((r) => r.prompt.name === 'New Prompt')).toBe(true);
    });
  });

  describe('searchPrompts', () => {
    it('returns all prompts sorted by usage when query is empty', () => {
      const results = searchPrompts('', prompts);

      expect(results.length).toBe(4);
      // First result should be the most used (Code Review with useCount 10 and recent usage)
      expect(results[0].prompt.name).toBe('Code Review');
    });

    it('returns all prompts when query is whitespace only', () => {
      const results = searchPrompts('   ', prompts);

      expect(results.length).toBe(4);
    });

    it('searches by name', () => {
      const results = searchPrompts('Code Review', prompts);

      expect(results[0].prompt.name).toBe('Code Review');
    });

    it('searches by partial name match', () => {
      const results = searchPrompts('code', prompts);

      // Should find Code Review
      expect(results.some((r) => r.prompt.name === 'Code Review')).toBe(true);
    });

    it('searches by tags', () => {
      const results = searchPrompts('bug', prompts);

      expect(results.some((r) => r.prompt.name === 'Bug Fix Template')).toBe(true);
    });

    it('searches by folder', () => {
      const results = searchPrompts('coding', prompts);

      expect(results.some((r) => r.prompt.folder === 'coding')).toBe(true);
    });

    it('searches by description', () => {
      const results = searchPrompts('professional emails', prompts);

      expect(results.some((r) => r.prompt.name === 'Email Draft')).toBe(true);
    });

    it('returns results with scores', () => {
      const results = searchPrompts('code', prompts);

      results.forEach((result) => {
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });

    it('limits results to 20 when no query', () => {
      const manyPrompts = Array.from({ length: 30 }, (_, i) =>
        createPrompt({ name: `Prompt ${i}`, useCount: i })
      );
      initializeSearch(manyPrompts);

      const results = searchPrompts('', manyPrompts);

      expect(results.length).toBe(20);
    });

    it('boosts results based on usage count', () => {
      const results = searchPrompts('template', prompts);

      // Bug Fix Template has useCount 5, Meeting Notes has useCount 3
      // Both match "template" in description
      const bugFixIndex = results.findIndex((r) => r.prompt.name === 'Bug Fix Template');
      const meetingIndex = results.findIndex((r) => r.prompt.name === 'Meeting Notes');

      // Bug Fix Template should rank higher due to higher usage
      if (bugFixIndex !== -1 && meetingIndex !== -1) {
        expect(bugFixIndex).toBeLessThan(meetingIndex);
      }
    });

    it('handles fuzzy matching', () => {
      const results = searchPrompts('reviw', prompts); // Typo in "review"

      // Should still find Code Review due to fuzzy matching
      expect(results.some((r) => r.prompt.name === 'Code Review')).toBe(true);
    });

    it('prioritizes name matches over other fields', () => {
      // Create prompts where one has "test" in name, another in description
      const testPrompts = [
        createPrompt({ name: 'Test in Name', description: 'Other description' }),
        createPrompt({ name: 'Other Name', description: 'Test in description' }),
      ];
      initializeSearch(testPrompts);

      const results = searchPrompts('test', testPrompts);

      expect(results[0].prompt.name).toBe('Test in Name');
    });
  });

  describe('usage scoring', () => {
    it('calculates higher scores for recently used prompts', () => {
      const recentPrompt = createPrompt({
        name: 'Recent',
        useCount: 5,
        lastUsedAt: new Date(), // Used today
      });
      const oldPrompt = createPrompt({
        name: 'Old',
        useCount: 5,
        lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      });

      initializeSearch([recentPrompt, oldPrompt]);
      const results = searchPrompts('', [recentPrompt, oldPrompt]);

      expect(results[0].prompt.name).toBe('Recent');
    });

    it('calculates scores for prompts never used', () => {
      const neverUsed = createPrompt({
        name: 'Never Used',
        useCount: 0,
      });

      initializeSearch([neverUsed]);
      const results = searchPrompts('', [neverUsed]);

      expect(results[0].score).toBe(0);
    });

    it('caps usage score contribution', () => {
      const heavyUser = createPrompt({
        name: 'Heavy',
        useCount: 1000, // Very high usage
      });
      const moderateUser = createPrompt({
        name: 'Moderate',
        useCount: 50,
      });

      initializeSearch([heavyUser, moderateUser]);
      const results = searchPrompts('', [heavyUser, moderateUser]);

      // Both should have capped usage scores, so scores shouldn't differ dramatically
      const scoreDiff = Math.abs(results[0].score - results[1].score);
      expect(scoreDiff).toBeLessThanOrEqual(5); // Cap is 5 points from usage
    });
  });
});
