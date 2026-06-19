'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils/cn';
import { Icon } from '@/components/ui/Icon';

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  /** Used for type-ahead matching; falls back to label when a string. */
  searchText?: string;
  disabled?: boolean;
};

/**
 * Pull width-related utilities (w-*, min-w-*, max-w-*, incl. responsive
 * variants) out of a className so they can be mirrored onto the wrapper.
 * This keeps the dropdown panel (w-full of the wrapper) the same width as
 * the trigger button at every breakpoint, while padding/text stay on the
 * button.
 */
function extractWidthClasses(className?: string): string {
  if (!className) return '';
  return className
    .split(/\s+/)
    .filter((token) => {
      const base = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
      return /^-?(w|min-w|max-w)-/.test(base);
    })
    .join(' ');
}

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Extra classes for the trigger button. */
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  onBlur?: () => void;
};

/**
 * Custom, fully-styled dropdown that replaces the native <select>.
 * The option list is rendered by us (not the OS) so it follows the
 * Heritage Tech color scheme in both light and dark mode.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  className,
  id,
  name,
  'aria-label': ariaLabel,
  onBlur,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef<{ query: string; at: number }>({ query: '', at: 0 });
  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  // Close on outside click / focus leaving the component.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, close, onBlur]);

  // Keep the active option in view while navigating.
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex]);

  const commit = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt || opt.disabled) return;
      onChange(opt.value);
      close();
    },
    [options, onChange, close]
  );

  const moveActive = useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((current) => {
        const count = options.length;
        if (count === 0) return -1;
        let next = current;
        for (let i = 0; i < count; i++) {
          next = (next + dir + count) % count;
          if (!options[next]?.disabled) return next;
        }
        return current;
      });
    },
    [options]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) openList();
          else moveActive(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) openList();
          else moveActive(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!open) openList();
          else if (activeIndex >= 0) commit(activeIndex);
          break;
        case 'Escape':
          if (open) {
            e.preventDefault();
            close();
          }
          break;
        case 'Tab':
          if (open) close();
          break;
        case 'Home':
          if (open) {
            e.preventDefault();
            setActiveIndex(options.findIndex((o) => !o.disabled));
          }
          break;
        case 'End':
          if (open) {
            e.preventDefault();
            for (let i = options.length - 1; i >= 0; i--) {
              if (!options[i].disabled) {
                setActiveIndex(i);
                break;
              }
            }
          }
          break;
        default:
          // Type-ahead.
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const now = Date.now();
            const ta = typeahead.current;
            ta.query = now - ta.at > 600 ? e.key : ta.query + e.key;
            ta.at = now;
            const q = ta.query.toLowerCase();
            const match = options.findIndex((o) => {
              const text =
                o.searchText ??
                (typeof o.label === 'string' ? o.label : o.value);
              return text.toLowerCase().startsWith(q);
            });
            if (match >= 0) {
              if (open) setActiveIndex(match);
              else commit(match);
            }
          }
          break;
      }
    },
    [disabled, open, openList, moveActive, activeIndex, commit, close, options]
  );

  return (
    <div
      ref={rootRef}
      className={cn('relative', extractWidthClasses(className) || 'w-full')}
    >
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-input border border-outline-variant bg-surface-container-lowest px-4 py-2 text-left text-on-surface transition focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className={cn('truncate', !selected && 'text-on-surface-variant')}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon
          name="expand_more"
          className={cn(
            'shrink-0 text-on-surface-variant transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-input border border-outline-variant bg-surface-container-lowest py-1 shadow-[0_18px_40px_rgba(23,32,16,0.18)] focus:outline-none"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm text-on-surface',
                  isActive && 'bg-secondary-container/70',
                  isSelected && 'font-semibold text-on-secondary-container',
                  opt.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Icon name="check" className="shrink-0 text-forest-green" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
