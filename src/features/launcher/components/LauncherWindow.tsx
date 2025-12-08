import { useEffect, useRef, useCallback, useState } from 'react';
import { Search, X, RefreshCw, Plus, Pencil, Settings } from 'lucide-react';
import { useAppStore, PromptMetadata } from '../../../stores/appStore';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  getPromptIndex,
  getPromptContent,
  recordPromptUsage,
  pasteAndHide,
} from '../../../lib/tauri/commands';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useFuzzySearch } from '../../../lib/search';

export function LauncherWindow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [allPrompts, setAllPrompts] = useState<PromptMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    selectedIndex,
    setSelectedIndex,
    results,
    setResults,
    selectNext,
    selectPrevious,
    promotedPrompt,
    riderText,
    setRiderText,
    isRiderMode,
    promoteSelectedPrompt,
    clearPromotion,
    reset,
    openEditor,
    openSettings,
  } = useAppStore();

  // Load prompts from backend on mount
  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const index = await getPromptIndex();
      setAllPrompts(index.prompts);
      setResults(index.prompts);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError('Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  }, [setResults]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fuzzy search with debouncing and scoring
  const { results: searchResults, isSearching } = useFuzzySearch(
    allPrompts,
    isRiderMode ? '' : searchQuery,
    { debounceMs: 50 }
  );

  // Update store results when search results change
  useEffect(() => {
    if (!isRiderMode) {
      setResults(searchResults);
    }
  }, [searchResults, isRiderMode, setResults]);

  const handlePaste = async (prompt: PromptMetadata, rider?: string) => {
    try {
      // Get the full prompt content
      const content = await getPromptContent(prompt.id);

      // Compose final text
      const finalText = rider ? `${content}\n\n${rider}` : content;

      // Copy to clipboard
      await writeText(finalText);

      // Record usage
      await recordPromptUsage(prompt.id);

      // Reset state
      reset();

      // Hide launcher and paste to previous app
      const pasteSuccess = await pasteAndHide();

      if (!pasteSuccess) {
        // Fallback: content is already on clipboard
        console.log('Paste simulation failed. Content copied to clipboard.');
      }
    } catch (err) {
      console.error('Failed to paste prompt:', err);
      // Still try to hide the window
      reset();
      await getCurrentWindow().hide();
    }
  };

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          if (isRiderMode && promotedPrompt) {
            await handlePaste(promotedPrompt, riderText || undefined);
          } else if (results[selectedIndex]) {
            await handlePaste(results[selectedIndex]);
          }
          break;
        case 'Tab':
        case ' ':
          if (!isRiderMode && results[selectedIndex]) {
            e.preventDefault();
            promoteSelectedPrompt();
          }
          break;
        case 'ArrowRight':
          if (!isRiderMode && results[selectedIndex] && !searchQuery) {
            e.preventDefault();
            promoteSelectedPrompt();
          }
          break;
        case 'Backspace':
          if (isRiderMode && !riderText) {
            e.preventDefault();
            clearPromotion();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isRiderMode) {
            clearPromotion();
          } else {
            reset();
            await getCurrentWindow().hide();
          }
          break;
      }
    },
    [
      isRiderMode,
      results,
      selectedIndex,
      searchQuery,
      riderText,
      promotedPrompt,
      selectNext,
      selectPrevious,
      promoteSelectedPrompt,
      clearPromotion,
      reset,
    ]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRiderMode) {
      setRiderText(e.target.value);
    } else {
      setSearchQuery(e.target.value);
    }
  };

  return (
    <div className="launcher-window p-2">
      <div className="launcher-container flex flex-col max-h-[380px]">
        {/* Search Input */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />

          {/* Promoted Prompt Pill */}
          {promotedPrompt && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm shrink-0">
              <span className="truncate max-w-[200px]">{promotedPrompt.name}</span>
              <button
                onClick={clearPromotion}
                className="hover:bg-primary-foreground/20 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={isRiderMode ? riderText : searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isRiderMode ? 'Add context...' : 'Search prompts...'}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />

          {/* Create new prompt */}
          <button
            onClick={() => openEditor(null)}
            className="p-1 hover:bg-muted rounded text-muted-foreground"
            title="Create new prompt"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Refresh button */}
          <button
            onClick={loadPrompts}
            className="p-1 hover:bg-muted rounded text-muted-foreground"
            title="Refresh prompts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isSearching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Results List */}
        {!isRiderMode && (
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading prompts...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                {error}
                <button
                  onClick={loadPrompts}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No prompts found' : 'No prompts yet. Create your first prompt!'}
              </div>
            ) : (
              <ul className="py-1">
                {results.map((prompt, index) => (
                  <li
                    key={prompt.id}
                    className={`group px-3 py-2 cursor-pointer flex items-center gap-2 ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => {
                      setSelectedIndex(index);
                      promoteSelectedPrompt();
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{prompt.name}</div>
                      {prompt.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {prompt.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {prompt.folder && (
                        <span className="px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
                          {prompt.folder}
                        </span>
                      )}
                      {prompt.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(prompt);
                        }}
                        className="p-1 hover:bg-muted rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit prompt"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Rider Mode Preview */}
        {isRiderMode && promotedPrompt && (
          <div className="p-3 border-t border-border">
            <div className="text-sm text-muted-foreground mb-1">Preview:</div>
            <div className="text-sm bg-muted p-2 rounded">
              <span className="text-primary font-medium">{promotedPrompt.name}</span>
              {riderText && <span className="text-muted-foreground"> + "{riderText}"</span>}
            </div>
          </div>
        )}

        {/* Footer with shortcuts */}
        <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground flex items-center gap-4">
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded">Tab</kbd> Promote
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> Paste
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close
          </span>
          <span className="flex-1" />
          <button
            onClick={openSettings}
            className="p-1 hover:bg-muted rounded"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
