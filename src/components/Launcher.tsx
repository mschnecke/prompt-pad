import { useEffect, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import { usePromptStore } from '../stores/promptStore';
import { useAppStore } from '../stores/appStore';
import { searchPrompts, updateSearchIndex } from '../utils/search';
import { loadPromptContent } from '../utils/storage';
import { pasteAndRestore } from '../utils/clipboard';
import { SearchInput } from './SearchInput';
import { ResultsList } from './ResultsList';
import { RiderPreview } from './RiderPreview';
import { PromptEditor } from './PromptEditor';
import type { Prompt } from '../types';

interface LauncherProps {
  onOpenManager: () => void;
  onOpenSettings: () => void;
}

export function Launcher({
  onOpenManager: _onOpenManager,
  onOpenSettings: _onOpenSettings,
}: LauncherProps) {
  const [showEditor, setShowEditor] = useState(false);
  const {
    mode,
    searchQuery,
    riderText,
    promotedPrompt,
    selectedIndex,
    results,
    isVisible,
    setSearchQuery,
    setRiderText,
    setResults,
    promotePrompt,
    clearPromotion,
    moveSelection,
    setVisible,
    reset,
  } = useLauncherStore();

  const { prompts } = usePromptStore();
  const { settings } = useAppStore();
  const { incrementUsage } = usePromptStore();

  // Update search index when prompts change
  useEffect(() => {
    updateSearchIndex(prompts);
  }, [prompts]);

  // Perform search when query changes
  useEffect(() => {
    if (mode === 'search') {
      const searchResults = searchPrompts(searchQuery, prompts);
      setResults(searchResults);
    }
  }, [searchQuery, prompts, mode, setResults]);

  const handlePaste = useCallback(
    async (prompt: Prompt) => {
      try {
        const content = await loadPromptContent(prompt);
        const textToPaste = riderText ? `${content.content} ${riderText}` : content.content;

        await pasteAndRestore(textToPaste, settings.preserveClipboard);
        incrementUsage(prompt.id);
        await invoke('hide_launcher');
        setVisible(false);
        reset();
      } catch (err) {
        console.error('Failed to copy prompt:', err);
      }
    },
    [riderText, settings.preserveClipboard, incrementUsage, setVisible, reset]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl+N to open new prompt editor
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowEditor(true);
        return;
      }

      if (mode === 'search') {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            moveSelection(1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            moveSelection(-1);
            break;
          case 'Enter':
            e.preventDefault();
            if (results[selectedIndex]) {
              handlePaste(results[selectedIndex].prompt);
            }
            break;
          case 'Tab':
          case 'ArrowRight':
            e.preventDefault();
            if (results[selectedIndex]) {
              promotePrompt(results[selectedIndex].prompt);
            }
            break;
          case ' ':
            // Space promotes only if there's no search query or cursor is at end
            if (!searchQuery || e.currentTarget === e.target) {
              if (results[selectedIndex]) {
                e.preventDefault();
                promotePrompt(results[selectedIndex].prompt);
              }
            }
            break;
          case 'Escape':
            e.preventDefault();
            setVisible(false);
            reset();
            break;
        }
      } else if (mode === 'rider') {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (promotedPrompt) {
              handlePaste(promotedPrompt);
            }
            break;
          case 'Backspace':
            if (riderText === '') {
              e.preventDefault();
              clearPromotion();
            }
            break;
          case 'Escape':
            e.preventDefault();
            setVisible(false);
            reset();
            break;
        }
      }
    },
    [
      mode,
      searchQuery,
      riderText,
      selectedIndex,
      results,
      promotedPrompt,
      moveSelection,
      promotePrompt,
      clearPromotion,
      handlePaste,
      setVisible,
      reset,
    ]
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      onClick={() => {
        setVisible(false);
        reset();
      }}
    >
      <div
        className="w-[650px] glass-effect rounded-xl shadow-elevated border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header with search and add button */}
        <div className="flex items-center gap-2 pr-2">
          <div className="flex-1">
            <SearchInput
              mode={mode}
              searchQuery={searchQuery}
              riderText={riderText}
              promotedPrompt={promotedPrompt}
              onSearchChange={setSearchQuery}
              onRiderChange={setRiderText}
              onClearPromotion={clearPromotion}
            />
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            title="New prompt (Cmd+N)"
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

        {mode === 'search' && results.length > 0 && (
          <ResultsList results={results} selectedIndex={selectedIndex} onSelect={handlePaste} />
        )}

        {mode === 'rider' && promotedPrompt && (
          <RiderPreview prompt={promotedPrompt} riderText={riderText} />
        )}

        {mode === 'search' && searchQuery && results.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No prompts found
          </div>
        )}

        {/* Keyboard hints */}
        <div className="px-3 py-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                Enter
              </kbd>{' '}
              paste
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                Tab
              </kbd>{' '}
              add context
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}N
              </kbd>{' '}
              new
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}M
              </kbd>{' '}
              manage
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Editor Modal */}
      {showEditor && (
        <PromptEditor
          onClose={() => setShowEditor(false)}
          onSave={() => {
            // Prompts will be updated in store, search index updates automatically
          }}
        />
      )}
    </div>
  );
}
