import { useEffect, useRef } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';
import '@milkdown/theme-nord/style.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your prompt here...',
  autoFocus = false,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!editorRef.current || isInitialized.current) return;

    isInitialized.current = true;

    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, editorRef.current!);
        ctx.set(defaultValueCtx, value);

        // Listen for changes
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          onChange(markdown);
        });
      })
      .config(nord)
      .use(commonmark)
      .use(listener)
      .create()
      .then((editor) => {
        editorInstance.current = editor;

        if (autoFocus && editorRef.current) {
          const editableEl = editorRef.current.querySelector('[contenteditable]');
          if (editableEl) {
            (editableEl as HTMLElement).focus();
          }
        }
      });

    return () => {
      editorInstance.current?.destroy();
      isInitialized.current = false;
    };
  }, []);

  return (
    <div
      ref={editorRef}
      className="milkdown-editor"
      data-placeholder={placeholder}
    />
  );
}
