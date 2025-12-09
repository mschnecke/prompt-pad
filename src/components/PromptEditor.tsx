import { useState, useEffect, useCallback } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { savePrompt, loadPromptContent, saveIndex, loadIndex } from '../utils/storage';
import { TagInput } from './TagInput';
import { FolderSelect } from './FolderSelect';
import { MarkdownEditor } from './MarkdownEditor';
import type { Prompt, PromptContent } from '../types';

interface PromptEditorProps {
  prompt?: Prompt;
  onClose: () => void;
  onSave: () => void;
}

export function PromptEditor({ prompt, onClose, onSave }: PromptEditorProps) {
  const { folders, tags: existingTags, addPrompt, updatePrompt } = usePromptStore();
  const isNew = !prompt;

  const [name, setName] = useState(prompt?.name || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState(prompt?.folder || 'uncategorized');
  const [tags, setTags] = useState<string[]>(prompt?.tags || []);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      loadPromptContent(prompt)
        .then((loaded) => {
          setContent(loaded.content);
          setIsLoading(false);
        })
        .catch(() => {
          setError('Failed to load prompt content');
          setIsLoading(false);
        });
    }
  }, [prompt]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const now = new Date();
      const fileName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
      const filePath = `${folder}/${fileName}`;

      const promptData: PromptContent = {
        id: prompt?.id || crypto.randomUUID(),
        name: name.trim(),
        description: description.trim() || undefined,
        folder,
        tags,
        filePath: prompt?.filePath || filePath,
        useCount: prompt?.useCount || 0,
        lastUsedAt: prompt?.lastUsedAt,
        createdAt: prompt?.createdAt || now,
        content: content.trim(),
      };

      await savePrompt(promptData);

      // Update store
      if (isNew) {
        addPrompt(promptData);
      } else {
        updatePrompt(promptData.id, promptData);
      }

      // Save index
      const index = await loadIndex();
      const existingIndex = index.prompts.findIndex((p) => p.id === promptData.id);
      if (existingIndex >= 0) {
        index.prompts[existingIndex] = promptData;
      } else {
        index.prompts.push(promptData);
      }
      index.lastUpdated = now;
      await saveIndex(index);

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  }, [name, description, content, folder, tags, prompt, isNew, addPrompt, updatePrompt, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [handleSave, onClose]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="bg-white dark:bg-gray-800 w-full h-full flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? 'New Prompt' : 'Edit Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter prompt name"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description (optional)"
            />
          </div>

          {/* Folder & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <FolderSelect
              value={folder}
              onChange={setFolder}
              folders={folders}
            />
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={existingTags}
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Enter your prompt content here..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'} to save, Esc to cancel
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
