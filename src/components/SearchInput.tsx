import { useEffect, useRef } from 'react';
import type { LauncherMode, Prompt } from '../types';

interface SearchInputProps {
  mode: LauncherMode;
  searchQuery: string;
  riderText: string;
  promotedPrompt: Prompt | null;
  onSearchChange: (query: string) => void;
  onRiderChange: (text: string) => void;
  onClearPromotion: () => void;
}

export function SearchInput({
  mode,
  searchQuery,
  riderText,
  promotedPrompt,
  onSearchChange,
  onRiderChange,
  onClearPromotion,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {mode === 'rider' && promotedPrompt && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-full text-sm font-medium shrink-0 max-w-[60%] animate-pill-in">
            <span className="truncate">{promotedPrompt.name}</span>
            <button
              onClick={onClearPromotion}
              className="ml-1 hover:bg-primary-600 rounded-full p-0.5"
              aria-label="Remove promoted prompt"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
          placeholder={mode === 'search' ? 'Search prompts...' : 'Add context...'}
          value={mode === 'search' ? searchQuery : riderText}
          onChange={(e) =>
            mode === 'search' ? onSearchChange(e.target.value) : onRiderChange(e.target.value)
          }
          autoFocus
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 ml-3">
        {mode === 'search' ? (
          <>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded ml-2">Tab</kbd>
            <span>promote</span>
          </>
        ) : (
          <>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
            <span>paste</span>
          </>
        )}
      </div>
    </div>
  );
}
