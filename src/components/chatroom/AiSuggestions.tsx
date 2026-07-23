import { cx } from '@/lib/types';
import { Sparkles, ChevronRight, Wand2, X } from 'lucide-react';

export function AiSuggestions({
  suggestions,
  onPick,
  onDismiss,
  onRegenerate,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
  onDismiss: () => void;
  onRegenerate: () => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-base-c bg-gradient-accent-soft/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
          <span className="text-xs font-semibold text-primary-c">AI Reply Suggestions</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-secondary-600 transition-colors hover:bg-secondary-500/10 dark:text-secondary-400"
          >
            <Wand2 className="h-3 w-3" /> Regenerate
          </button>
          <button
            onClick={onDismiss}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-c hover:text-primary-c"
            aria-label="Dismiss suggestions"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            className={cx(
              'group flex shrink-0 max-w-xs items-center gap-2 rounded-xl2 border border-secondary-500/20 bg-card-c px-3 py-2 text-left text-xs text-secondary-c transition-all hover:border-secondary-500/40 hover:shadow-soft',
            )}
          >
            <span className="line-clamp-2 max-w-[220px]">{s}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-secondary-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
