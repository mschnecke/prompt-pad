import { useEffect, useState } from 'react';
import { loadPromptContent } from '../utils/storage';
import type { Prompt } from '../types';

interface RiderPreviewProps {
  prompt: Prompt;
  riderText: string;
}

export function RiderPreview({ prompt, riderText }: RiderPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const loaded = await loadPromptContent(prompt);
        if (!cancelled) {
          setContent(loaded.content);
        }
      } catch (error) {
        console.error('Failed to load prompt content:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [prompt]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
        Loading preview...
      </div>
    );
  }

  const combinedText = riderText ? `${content} ${riderText}` : content;

  return (
    <div className="px-4 py-3 max-h-[280px] overflow-y-auto hide-scrollbar animate-slide-down">
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Preview
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
        <span>{content}</span>
        {riderText && (
          <span className="text-primary-600 dark:text-primary-400 font-medium"> {riderText}</span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{combinedText.length} characters</span>
          <span>Press Enter to copy</span>
        </div>
      </div>
    </div>
  );
}
