'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
  error?: string;
  showPreview?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  minHeight = '200px',
  maxLength = 5000,
  error,
  showPreview = true,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;

    onChange(newValue);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === textBeforeCursor.length - 1) {
      // Show mention suggestions
      // In real implementation, fetch user handles from Firestore
      setMentionSuggestions(['user1', 'user2', 'admin']);
    } else {
      setMentionSuggestions([]);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mode Toggle */}
        {showPreview && (
          <div className="flex gap-1 rounded-input bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={cn(
                'rounded px-3 py-1 text-sm font-medium transition-all',
                mode === 'write'
                  ? 'bg-surface-container-lowest text-deep-green shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={cn(
                'rounded px-3 py-1 text-sm font-medium transition-all',
                mode === 'preview'
                  ? 'bg-surface-container-lowest text-deep-green shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Preview
            </button>
          </div>
        )}

        {/* Formatting Buttons */}
        {mode === 'write' && (
          <>
            <div className="h-6 w-px bg-outline-variant"></div>
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="px-2 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('_', '_')}
              className="px-2 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors italic"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`')}
              className="px-2 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors font-mono text-sm"
              title="Code"
            >
              {'</>'}
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](url)')}
              className="px-2 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="Link"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n- ', '')}
              className="px-2 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="List"
            >
              •
            </button>
          </>
        )}

        {/* Character Count */}
        <div className="ml-auto text-sm text-outline">
          {value.length}
          {maxLength && `/${maxLength}`}
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {mode === 'write' ? (
            <motion.div
              key="write"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                style={{ minHeight }}
                className={cn(
                  'w-full resize-y rounded-input border-2 bg-surface-container-lowest px-4 py-3 font-mono text-sm focus:border-forest-green focus:outline-none',
                  error ? 'border-error' : 'border-outline-variant'
                )}
              />
              {mentionSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 rounded-input border border-outline-variant/30 bg-surface-container-lowest shadow-[0px_20px_40px_rgba(0,50,0,0.12)]">
                  {mentionSuggestions.map((user) => (
                    <button
                      key={user}
                      type="button"
                      className="block w-full px-4 py-2 text-left transition-colors hover:bg-primary-fixed/20"
                      onClick={() => {
                        onChange(value + user + ' ');
                        setMentionSuggestions([]);
                      }}
                    >
                      @{user}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ minHeight }}
              className="prose prose-sm w-full max-w-none overflow-auto rounded-input border-2 border-outline-variant bg-surface-container-low px-4 py-3"
            >
              {value.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="italic text-outline">Nothing to preview</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-error">{error}</p>}

      {/* Help Text */}
      <p className="text-xs text-outline">
        Supports <strong>bold</strong>, <em>italic</em>, <code>code</code>,
        lists, and links. Mention users with @username
      </p>
    </div>
  );
}

