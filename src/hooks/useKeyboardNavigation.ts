import { useCallback, useEffect } from 'react';

interface UseKeyboardNavigationProps {
  itemCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  selectedIndex,
  onSelect,
  onConfirm,
  onCancel,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          onSelect(Math.min(selectedIndex + 1, itemCount - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          onSelect(Math.max(selectedIndex - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          onConfirm();
          break;
        case 'Escape':
          event.preventDefault();
          onCancel();
          break;
      }
    },
    [enabled, itemCount, selectedIndex, onSelect, onConfirm, onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
