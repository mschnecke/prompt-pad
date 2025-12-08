import { useRef, useEffect } from 'react';
import { PromptItem } from './PromptItem';
import type { SearchResult, Prompt } from '../types';

interface ResultsListProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (prompt: Prompt) => void;
}

export function ResultsList({ results, selectedIndex, onSelect }: ResultsListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const list = listRef.current;
      const selected = selectedRef.current;

      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      if (selectedRect.top < listRect.top) {
        selected.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else if (selectedRect.bottom > listRect.bottom) {
        selected.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      ref={listRef}
      className="max-h-[320px] overflow-y-auto hide-scrollbar animate-slide-down"
      role="listbox"
      aria-label="Search results"
    >
      {results.slice(0, 20).map((result, index) => (
        <div
          key={result.prompt.id}
          ref={index === selectedIndex ? selectedRef : undefined}
          role="option"
          aria-selected={index === selectedIndex}
          className="animate-list-item"
          style={{ animationDelay: `${index * 20}ms`, animationFillMode: 'backwards' }}
        >
          <PromptItem
            prompt={result.prompt}
            isSelected={index === selectedIndex}
            onClick={() => onSelect(result.prompt)}
          />
        </div>
      ))}
    </div>
  );
}
