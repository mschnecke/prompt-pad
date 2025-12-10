import { useState } from 'react';
import { createFolder } from '../utils/storage';

interface FolderSelectProps {
  value: string;
  onChange: (folder: string) => void;
  folders: string[];
}

export function FolderSelect({ value, onChange, folders }: FolderSelectProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const allFolders = ['uncategorized', ...folders.filter((f) => f !== 'uncategorized')];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      const folderName = newFolderName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      await createFolder(folderName);
      onChange(folderName);
      setNewFolderName('');
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Folder
      </label>
      {showCreate ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateFolder();
              } else if (e.key === 'Escape') {
                setShowCreate(false);
                setNewFolderName('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="Folder name"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateFolder}
            disabled={isCreating}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
          >
            {isCreating ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(false);
              setNewFolderName('');
            }}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {allFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
            title="Create new folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
