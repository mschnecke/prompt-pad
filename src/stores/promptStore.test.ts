import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePromptStore } from './promptStore';
import type { Prompt, PromptIndex } from '../types';

// Mock storage module
vi.mock('../utils/storage', () => ({
  loadIndex: vi.fn(),
}));

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

describe('promptStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    usePromptStore.setState({
      prompts: [],
      folders: [],
      tags: [],
      isLoading: false,
      error: null,
    });
  });

  describe('setPrompts', () => {
    it('sets prompts and extracts folders and tags', () => {
      const prompts = [
        createPrompt({ folder: 'coding', tags: ['code', 'review'] }),
        createPrompt({ folder: 'work', tags: ['meeting', 'notes'] }),
        createPrompt({ folder: 'coding', tags: ['code', 'debug'] }),
      ];

      usePromptStore.getState().setPrompts(prompts);

      const state = usePromptStore.getState();
      expect(state.prompts).toHaveLength(3);
      expect(state.folders).toContain('coding');
      expect(state.folders).toContain('work');
      expect(state.folders).toHaveLength(2);
      expect(state.tags).toContain('code');
      expect(state.tags).toContain('review');
      expect(state.tags).toContain('meeting');
      expect(state.tags).toContain('notes');
      expect(state.tags).toContain('debug');
    });

    it('handles prompts without folders', () => {
      const prompts = [
        createPrompt({ folder: undefined, tags: ['tag1'] }),
        createPrompt({ folder: 'work', tags: ['tag2'] }),
      ];

      usePromptStore.getState().setPrompts(prompts);

      const state = usePromptStore.getState();
      expect(state.folders).toEqual(['work']);
    });

    it('deduplicates tags', () => {
      const prompts = [
        createPrompt({ tags: ['tag1', 'tag2'] }),
        createPrompt({ tags: ['tag2', 'tag3'] }),
      ];

      usePromptStore.getState().setPrompts(prompts);

      const state = usePromptStore.getState();
      expect(state.tags).toHaveLength(3);
      expect(state.tags).toEqual(expect.arrayContaining(['tag1', 'tag2', 'tag3']));
    });
  });

  describe('addPrompt', () => {
    it('adds a prompt to the store', () => {
      const prompt = createPrompt({ name: 'New Prompt' });

      usePromptStore.getState().addPrompt(prompt);

      const state = usePromptStore.getState();
      expect(state.prompts).toHaveLength(1);
      expect(state.prompts[0].name).toBe('New Prompt');
    });

    it('updates folders when adding prompt with new folder', () => {
      const prompt = createPrompt({ folder: 'new-folder' });

      usePromptStore.getState().addPrompt(prompt);

      const state = usePromptStore.getState();
      expect(state.folders).toContain('new-folder');
    });

    it('updates tags when adding prompt with new tags', () => {
      const prompt = createPrompt({ tags: ['new-tag'] });

      usePromptStore.getState().addPrompt(prompt);

      const state = usePromptStore.getState();
      expect(state.tags).toContain('new-tag');
    });
  });

  describe('updatePrompt', () => {
    it('updates an existing prompt', () => {
      const prompt = createPrompt({ id: 'test-id', name: 'Original' });
      usePromptStore.setState({ prompts: [prompt], folders: [], tags: [] });

      usePromptStore.getState().updatePrompt('test-id', { name: 'Updated' });

      const state = usePromptStore.getState();
      expect(state.prompts[0].name).toBe('Updated');
    });

    it('preserves other prompt properties when updating', () => {
      const prompt = createPrompt({ id: 'test-id', name: 'Original', description: 'Original desc' });
      usePromptStore.setState({ prompts: [prompt], folders: [], tags: [] });

      usePromptStore.getState().updatePrompt('test-id', { name: 'Updated' });

      const state = usePromptStore.getState();
      expect(state.prompts[0].description).toBe('Original desc');
    });

    it('does not modify other prompts', () => {
      const prompt1 = createPrompt({ id: 'id-1', name: 'Prompt 1' });
      const prompt2 = createPrompt({ id: 'id-2', name: 'Prompt 2' });
      usePromptStore.setState({ prompts: [prompt1, prompt2], folders: [], tags: [] });

      usePromptStore.getState().updatePrompt('id-1', { name: 'Updated' });

      const state = usePromptStore.getState();
      expect(state.prompts.find((p) => p.id === 'id-2')?.name).toBe('Prompt 2');
    });

    it('recalculates folders and tags after update', () => {
      const prompt = createPrompt({ id: 'test-id', folder: 'old-folder', tags: ['old-tag'] });
      usePromptStore.setState({ prompts: [prompt], folders: ['old-folder'], tags: ['old-tag'] });

      usePromptStore.getState().updatePrompt('test-id', { folder: 'new-folder', tags: ['new-tag'] });

      const state = usePromptStore.getState();
      expect(state.folders).toContain('new-folder');
      expect(state.folders).not.toContain('old-folder');
      expect(state.tags).toContain('new-tag');
      expect(state.tags).not.toContain('old-tag');
    });
  });

  describe('deletePrompt', () => {
    it('removes a prompt from the store', () => {
      const prompt = createPrompt({ id: 'test-id' });
      usePromptStore.setState({ prompts: [prompt], folders: [], tags: [] });

      usePromptStore.getState().deletePrompt('test-id');

      const state = usePromptStore.getState();
      expect(state.prompts).toHaveLength(0);
    });

    it('removes folder when last prompt in folder is deleted', () => {
      const prompt = createPrompt({ id: 'test-id', folder: 'only-folder' });
      usePromptStore.setState({ prompts: [prompt], folders: ['only-folder'], tags: [] });

      usePromptStore.getState().deletePrompt('test-id');

      const state = usePromptStore.getState();
      expect(state.folders).not.toContain('only-folder');
    });

    it('keeps folder when other prompts still use it', () => {
      const prompt1 = createPrompt({ id: 'id-1', folder: 'shared-folder' });
      const prompt2 = createPrompt({ id: 'id-2', folder: 'shared-folder' });
      usePromptStore.setState({ prompts: [prompt1, prompt2], folders: ['shared-folder'], tags: [] });

      usePromptStore.getState().deletePrompt('id-1');

      const state = usePromptStore.getState();
      expect(state.folders).toContain('shared-folder');
    });
  });

  describe('incrementUsage', () => {
    it('increments use count for a prompt', () => {
      const prompt = createPrompt({ id: 'test-id', useCount: 5 });
      usePromptStore.setState({ prompts: [prompt], folders: [], tags: [] });

      usePromptStore.getState().incrementUsage('test-id');

      const state = usePromptStore.getState();
      expect(state.prompts[0].useCount).toBe(6);
    });

    it('sets lastUsedAt to current date', () => {
      const prompt = createPrompt({ id: 'test-id', useCount: 0, lastUsedAt: undefined });
      usePromptStore.setState({ prompts: [prompt], folders: [], tags: [] });

      const beforeIncrement = new Date();
      usePromptStore.getState().incrementUsage('test-id');
      const afterIncrement = new Date();

      const state = usePromptStore.getState();
      expect(state.prompts[0].lastUsedAt).toBeDefined();
      expect(state.prompts[0].lastUsedAt!.getTime()).toBeGreaterThanOrEqual(beforeIncrement.getTime());
      expect(state.prompts[0].lastUsedAt!.getTime()).toBeLessThanOrEqual(afterIncrement.getTime());
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      usePromptStore.getState().setLoading(true);
      expect(usePromptStore.getState().isLoading).toBe(true);

      usePromptStore.getState().setLoading(false);
      expect(usePromptStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      usePromptStore.getState().setError('Test error');
      expect(usePromptStore.getState().error).toBe('Test error');
    });

    it('clears error message', () => {
      usePromptStore.setState({ error: 'Existing error' });
      usePromptStore.getState().setError(null);
      expect(usePromptStore.getState().error).toBeNull();
    });
  });

  describe('loadIndex', () => {
    it('loads prompts from index', () => {
      const prompts = [
        createPrompt({ folder: 'folder1', tags: ['tag1'] }),
        createPrompt({ folder: 'folder2', tags: ['tag2'] }),
      ];

      const index: PromptIndex = {
        version: 1,
        prompts,
        lastUpdated: new Date(),
      };

      usePromptStore.getState().loadIndex(index);

      const state = usePromptStore.getState();
      expect(state.prompts).toHaveLength(2);
      expect(state.folders).toContain('folder1');
      expect(state.folders).toContain('folder2');
      expect(state.tags).toContain('tag1');
      expect(state.tags).toContain('tag2');
      expect(state.isLoading).toBe(false);
    });
  });
});
