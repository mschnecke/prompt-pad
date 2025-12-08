import { useState, useMemo, useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { PromptEditor } from './PromptEditor';
import { ImportExport } from './ImportExport';
import { deletePromptFile, saveIndex, loadIndex } from '../utils/storage';
import type { Prompt } from '../types';

interface PromptManagerProps {
  onClose: () => void;
}

export function PromptManager({ onClose }: PromptManagerProps) {
  const { prompts, folders, deletePrompt, loadPrompts } = usePromptStore();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Prompt | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      if (selectedFolder && p.folder !== selectedFolder) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [prompts, selectedFolder, searchQuery]);

  const handleDelete = async (prompt: Prompt) => {
    try {
      await deletePromptFile(prompt.filePath);
      deletePrompt(prompt.id);

      // Update index
      const index = await loadIndex();
      index.prompts = index.prompts.filter((p) => p.id !== prompt.id);
      index.lastUpdated = new Date();
      await saveIndex(index);

      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const allFolders = ['All', 'uncategorized', ...folders.filter((f) => f !== 'uncategorized')];

  // Close on Escape key (only if no modals are open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating && !editingPrompt && !deleteConfirm && !showImportExport) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isCreating, editingPrompt, deleteConfirm, showImportExport]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="bg-white dark:bg-gray-800 w-full h-full flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Prompts</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Import/Export
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Prompt
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedFolder || 'All'}
            onChange={(e) => setSelectedFolder(e.target.value === 'All' ? null : e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {allFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No prompts found</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 text-primary-500 hover:text-primary-600"
              >
                Create your first prompt
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {prompt.name}
                      </h3>
                      {prompt.folder && prompt.folder !== 'uncategorized' && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {prompt.folder}
                        </span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                        {prompt.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {prompt.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-gray-400">
                        Used {prompt.useCount} times
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingPrompt(prompt)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(prompt)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Editor Modal */}
      {(isCreating || editingPrompt) && (
        <PromptEditor
          prompt={editingPrompt || undefined}
          onClose={() => {
            setIsCreating(false);
            setEditingPrompt(null);
          }}
          onSave={() => {}}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Prompt
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExport
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => loadPrompts()}
        />
      )}
    </div>
  );
}
