import { describe, it, expect, beforeEach } from 'vitest';
import { useLauncherStore } from './launcherStore';
import type { Prompt, SearchResult } from '../types';

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

const createSearchResult = (prompt: Prompt, score: number = 100): SearchResult => ({
  prompt,
  score,
});

describe('launcherStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useLauncherStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts in search mode', () => {
      const state = useLauncherStore.getState();
      expect(state.mode).toBe('search');
    });

    it('starts with empty search query', () => {
      const state = useLauncherStore.getState();
      expect(state.searchQuery).toBe('');
    });

    it('starts with no promoted prompt', () => {
      const state = useLauncherStore.getState();
      expect(state.promotedPrompt).toBeNull();
    });

    it('starts visible', () => {
      const state = useLauncherStore.getState();
      expect(state.isVisible).toBe(true);
    });
  });

  describe('setMode', () => {
    it('changes mode to rider', () => {
      useLauncherStore.getState().setMode('rider');
      expect(useLauncherStore.getState().mode).toBe('rider');
    });

    it('changes mode to search', () => {
      useLauncherStore.setState({ mode: 'rider' });
      useLauncherStore.getState().setMode('search');
      expect(useLauncherStore.getState().mode).toBe('search');
    });
  });

  describe('setSearchQuery', () => {
    it('sets search query', () => {
      useLauncherStore.getState().setSearchQuery('test query');
      expect(useLauncherStore.getState().searchQuery).toBe('test query');
    });

    it('resets selected index to 0 when query changes', () => {
      useLauncherStore.setState({ selectedIndex: 5 });
      useLauncherStore.getState().setSearchQuery('new query');
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('setRiderText', () => {
    it('sets rider text', () => {
      useLauncherStore.getState().setRiderText('some context');
      expect(useLauncherStore.getState().riderText).toBe('some context');
    });
  });

  describe('promotePrompt', () => {
    it('switches to rider mode', () => {
      const prompt = createPrompt();
      useLauncherStore.getState().promotePrompt(prompt);
      expect(useLauncherStore.getState().mode).toBe('rider');
    });

    it('sets promoted prompt', () => {
      const prompt = createPrompt({ name: 'Promoted' });
      useLauncherStore.getState().promotePrompt(prompt);
      expect(useLauncherStore.getState().promotedPrompt?.name).toBe('Promoted');
    });

    it('clears search query', () => {
      useLauncherStore.setState({ searchQuery: 'existing query' });
      useLauncherStore.getState().promotePrompt(createPrompt());
      expect(useLauncherStore.getState().searchQuery).toBe('');
    });

    it('clears rider text', () => {
      useLauncherStore.setState({ riderText: 'existing rider' });
      useLauncherStore.getState().promotePrompt(createPrompt());
      expect(useLauncherStore.getState().riderText).toBe('');
    });
  });

  describe('clearPromotion', () => {
    it('switches back to search mode', () => {
      useLauncherStore.setState({ mode: 'rider' });
      useLauncherStore.getState().clearPromotion();
      expect(useLauncherStore.getState().mode).toBe('search');
    });

    it('clears promoted prompt', () => {
      useLauncherStore.setState({ promotedPrompt: createPrompt() });
      useLauncherStore.getState().clearPromotion();
      expect(useLauncherStore.getState().promotedPrompt).toBeNull();
    });

    it('clears rider text', () => {
      useLauncherStore.setState({ riderText: 'some text' });
      useLauncherStore.getState().clearPromotion();
      expect(useLauncherStore.getState().riderText).toBe('');
    });
  });

  describe('setSelectedIndex', () => {
    it('sets selected index', () => {
      useLauncherStore.getState().setSelectedIndex(5);
      expect(useLauncherStore.getState().selectedIndex).toBe(5);
    });
  });

  describe('moveSelection', () => {
    beforeEach(() => {
      const results = [
        createSearchResult(createPrompt({ name: 'Result 1' })),
        createSearchResult(createPrompt({ name: 'Result 2' })),
        createSearchResult(createPrompt({ name: 'Result 3' })),
      ];
      useLauncherStore.setState({ results, selectedIndex: 1 });
    });

    it('moves selection down', () => {
      useLauncherStore.getState().moveSelection(1);
      expect(useLauncherStore.getState().selectedIndex).toBe(2);
    });

    it('moves selection up', () => {
      useLauncherStore.getState().moveSelection(-1);
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });

    it('does not go below 0', () => {
      useLauncherStore.setState({ selectedIndex: 0 });
      useLauncherStore.getState().moveSelection(-1);
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });

    it('does not go above max index', () => {
      useLauncherStore.setState({ selectedIndex: 2 }); // Max is 2 (3 results - 1)
      useLauncherStore.getState().moveSelection(1);
      expect(useLauncherStore.getState().selectedIndex).toBe(2);
    });

    it('handles large negative delta', () => {
      useLauncherStore.getState().moveSelection(-10);
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });

    it('handles large positive delta', () => {
      useLauncherStore.getState().moveSelection(10);
      expect(useLauncherStore.getState().selectedIndex).toBe(2);
    });
  });

  describe('setResults', () => {
    it('sets search results', () => {
      const results = [
        createSearchResult(createPrompt({ name: 'Result 1' })),
        createSearchResult(createPrompt({ name: 'Result 2' })),
      ];

      useLauncherStore.getState().setResults(results);

      expect(useLauncherStore.getState().results).toHaveLength(2);
    });

    it('resets selected index to 0', () => {
      useLauncherStore.setState({ selectedIndex: 5 });
      useLauncherStore.getState().setResults([]);
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('setVisible', () => {
    it('sets visibility to true', () => {
      useLauncherStore.setState({ isVisible: false });
      useLauncherStore.getState().setVisible(true);
      expect(useLauncherStore.getState().isVisible).toBe(true);
    });

    it('sets visibility to false', () => {
      useLauncherStore.getState().setVisible(false);
      expect(useLauncherStore.getState().isVisible).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Set some non-initial state
      useLauncherStore.setState({
        mode: 'rider',
        searchQuery: 'some query',
        riderText: 'some rider',
        promotedPrompt: createPrompt(),
        selectedIndex: 5,
        results: [createSearchResult(createPrompt())],
        isVisible: false,
      });

      useLauncherStore.getState().reset();

      const state = useLauncherStore.getState();
      expect(state.mode).toBe('search');
      expect(state.searchQuery).toBe('');
      expect(state.riderText).toBe('');
      expect(state.promotedPrompt).toBeNull();
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toHaveLength(0);
      expect(state.isVisible).toBe(true);
    });
  });

  describe('workflow: search to rider to search', () => {
    it('handles complete promote/clear cycle', () => {
      // Start in search mode
      expect(useLauncherStore.getState().mode).toBe('search');

      // Search and select a prompt
      useLauncherStore.getState().setSearchQuery('test');
      const results = [createSearchResult(createPrompt({ name: 'Test Prompt' }))];
      useLauncherStore.getState().setResults(results);

      // Promote the prompt
      useLauncherStore.getState().promotePrompt(results[0].prompt);
      expect(useLauncherStore.getState().mode).toBe('rider');
      expect(useLauncherStore.getState().promotedPrompt?.name).toBe('Test Prompt');
      expect(useLauncherStore.getState().searchQuery).toBe('');

      // Add rider text
      useLauncherStore.getState().setRiderText('Additional context');
      expect(useLauncherStore.getState().riderText).toBe('Additional context');

      // Clear promotion and return to search
      useLauncherStore.getState().clearPromotion();
      expect(useLauncherStore.getState().mode).toBe('search');
      expect(useLauncherStore.getState().promotedPrompt).toBeNull();
      expect(useLauncherStore.getState().riderText).toBe('');
    });
  });
});
