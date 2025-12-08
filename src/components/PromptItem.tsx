import type { Prompt } from '../types';

interface PromptItemProps {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
}

export function PromptItem({ prompt, isSelected, onClick }: PromptItemProps) {
  return (
    <div
      className={`px-4 py-3 cursor-pointer transition-all duration-150 ease-out ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 pl-[14px]'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate ${
                isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {prompt.name}
            </span>

            {prompt.folder && prompt.folder !== 'uncategorized' && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {prompt.folder}
              </span>
            )}
          </div>

          {prompt.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
              {prompt.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{prompt.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}
