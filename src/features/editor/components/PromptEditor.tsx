import { useState, useEffect, useCallback } from 'react';
import { Save, X, Trash2, FolderPlus } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { TagInput } from './TagInput';
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  getPromptContent,
  listFolders,
  createFolder,
  getPromptIndex,
} from '../../../lib/tauri/commands';
import type { PromptMetadata, CreatePromptInput, UpdatePromptInput } from '../../../lib/tauri/types';

interface PromptEditorProps {
  /** Prompt to edit, or null for creating new */
  prompt: PromptMetadata | null;
  /** Callback when save is complete */
  onSave: (prompt: PromptMetadata) => void;
  /** Callback when editor is closed */
  onClose: () => void;
  /** Callback when prompt is deleted */
  onDelete?: () => void;
}

export function PromptEditor({ prompt, onSave, onClose, onDelete }: PromptEditorProps) {
  const isEditing = !!prompt;

  // Form state
  const [name, setName] = useState(prompt?.name ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState(prompt?.folder ?? '');
  const [tags, setTags] = useState<string[]>(prompt?.tags ?? []);

  // UI state
  const [folders, setFolders] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load folders and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [folderList, index] = await Promise.all([
          listFolders(),
          getPromptIndex(),
        ]);
        setFolders(folderList);
        setAllTags(index.tags);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  // Load content if editing
  useEffect(() => {
    if (prompt) {
      setIsLoading(true);
      getPromptContent(prompt.id)
        .then(setContent)
        .catch((err) => {
          console.error('Failed to load content:', err);
          setError('Failed to load prompt content');
        })
        .finally(() => setIsLoading(false));
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
      let savedPrompt: PromptMetadata;

      if (isEditing && prompt) {
        const input: UpdatePromptInput = {
          name: name.trim(),
          description: description.trim() || null,
          content,
          folder: folder.trim() || null,
          tags,
        };
        savedPrompt = await updatePrompt(prompt.id, input);
      } else {
        const input: CreatePromptInput = {
          name: name.trim(),
          description: description.trim() || null,
          content,
          folder: folder.trim() || null,
          tags,
        };
        savedPrompt = await createPrompt(input);
      }

      onSave(savedPrompt);
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError('Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  }, [name, description, content, folder, tags, isEditing, prompt, onSave]);

  const handleDelete = useCallback(async () => {
    if (!prompt) return;

    setIsSaving(true);
    try {
      await deletePrompt(prompt.id);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError('Failed to delete prompt');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  }, [prompt, onDelete]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setFolders([...folders, newFolderName.trim()].sort());
      setFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="editor-panel flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Edit Prompt' : 'New Prompt'}
        </h2>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded"
              title="Delete prompt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter prompt name"
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:border-primary outline-none"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:border-primary outline-none"
          />
        </div>

        {/* Folder */}
        <div>
          <label className="block text-sm font-medium mb-1">Folder</label>
          <div className="flex gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:border-primary outline-none"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="p-2 border border-border rounded-md hover:bg-muted"
              title="Create new folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {showNewFolder && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:border-primary outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Create
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={allTags}
            placeholder="Add tags..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Write your prompt content here..."
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Prompt?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{prompt?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 hover:bg-muted rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with shortcuts */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center gap-4">
        <span>
          <kbd className="px-1 py-0.5 bg-muted rounded">Cmd+S</kbd> Save
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close
        </span>
      </div>
    </div>
  );
}
