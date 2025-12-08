import { useState, useRef } from 'react';
import { usePromptStore } from '../stores/promptStore';
import {
  importMarkdownFile,
  importBulkJson,
  exportToJson,
  downloadJson,
  type BulkImportPrompt,
  type ImportResult,
} from '../utils/importExport';

interface ImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

type Tab = 'import' | 'export';

export function ImportExport({ onClose, onImportComplete }: ImportExportProps) {
  const { prompts, addPrompt } = usePromptStore();
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [importType, setImportType] = useState<'markdown' | 'json'>('markdown');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    const importResult: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      if (importType === 'markdown') {
        for (const file of Array.from(files)) {
          if (!file.name.endsWith('.md')) {
            importResult.failed++;
            importResult.errors.push(`${file.name}: Not a markdown file`);
            continue;
          }

          try {
            const content = await file.text();
            const prompt = await importMarkdownFile(file.name, content);
            addPrompt(prompt);
            importResult.success++;
          } catch (err) {
            importResult.failed++;
            importResult.errors.push(`${file.name}: ${err}`);
          }
        }
      } else {
        // JSON import
        const file = files[0];
        try {
          const content = await file.text();
          const data = JSON.parse(content) as BulkImportPrompt[];

          if (!Array.isArray(data)) {
            throw new Error('JSON must be an array of prompts');
          }

          const bulkResult = await importBulkJson(data);
          importResult.success = bulkResult.success;
          importResult.failed = bulkResult.failed;
          importResult.errors = bulkResult.errors;

          // Reload prompts
          onImportComplete();
        } catch (err) {
          importResult.failed++;
          importResult.errors.push(`${file.name}: ${err}`);
        }
      }
    } finally {
      setIsProcessing(false);
      setResult(importResult);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const exported = await exportToJson(prompts);
      const filename = `promptpad-export-${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(exported, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import / Export</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Export
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Import Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Import Type
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'markdown'}
                      onChange={() => setImportType('markdown')}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Markdown files (.md)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'json'}
                      onChange={() => setImportType('json')}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">JSON file</span>
                  </label>
                </div>
              </div>

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importType === 'markdown' ? '.md' : '.json'}
                  multiple={importType === 'markdown'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      Click to select {importType === 'markdown' ? 'markdown files' : 'a JSON file'}
                      <br />
                      <span className="text-xs">
                        {importType === 'markdown' ? 'Multiple files supported' : 'Single file only'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Result */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.failed > 0
                      ? 'bg-yellow-50 dark:bg-yellow-900/30'
                      : 'bg-green-50 dark:bg-green-900/30'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Imported {result.success} prompt{result.success !== 1 ? 's' : ''}
                    {result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* JSON Format Help */}
              {importType === 'json' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Expected JSON format:</p>
                  <pre className="overflow-x-auto">
{`[
  {
    "name": "Prompt Name",
    "description": "Optional description",
    "content": "The prompt content",
    "folder": "optional-folder",
    "tags": ["tag1", "tag2"]
  }
]`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export all your prompts to a JSON file. This file can be used to backup your prompts
                or import them on another device.
              </p>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>{prompts.length}</strong> prompt{prompts.length !== 1 ? 's' : ''} will be exported
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={isProcessing || prompts.length === 0}
                className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Exporting...' : 'Export to JSON'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
