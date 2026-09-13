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
    <div className="border-t border-base-c/80 bg-slate-900/5 dark:bg-ink-950/40 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="grid h-5 w-5 place-items-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-primary-c tracking-wide">AI Copilot Quick Replies</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-500/10 shadow-xs"
            title="Regenerate smart responses"
          >
            <Wand2 className="h-3 w-3" /> Regenerate
          </button>
          <button
            onClick={onDismiss}
            className="grid h-6 w-6 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
            aria-label="Dismiss suggestions"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            className={cx(
              'group flex shrink-0 max-w-sm items-center gap-2 rounded-xl border border-violet-500/30 bg-card-c/95 px-3.5 py-2 text-left text-xs font-medium text-primary-c shadow-soft transition-all hover:border-violet-500/60 hover:bg-violet-500/5 hover:scale-102 btn-tactile',
            )}
          >
            <span className="line-clamp-1 max-w-[240px]">{s}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-violet-500 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
}

