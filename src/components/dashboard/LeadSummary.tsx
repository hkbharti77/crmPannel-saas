import { GlassCard, Badge } from '@/components/ui/primitives';
import { BarRow } from '@/components/ui/charts';
import { KanbanSquare, ArrowRight } from 'lucide-react';
import type { PipelineStageCountDTO } from '@/lib/dashboardApi';

export function LeadSummary({
  pipeline = [],
  onOpenPipeline,
}: {
  pipeline?: PipelineStageCountDTO[];
  onOpenPipeline: () => void;
}) {
  const defaultStages: PipelineStageCountDTO[] = [
    { stageName: 'New', count: 0, color: '#94A3B8' },
    { stageName: 'Interested', count: 0, color: '#0EA5E9' },
    { stageName: 'Follow Up', count: 0, color: '#F59E0B' },
    { stageName: 'Won', count: 0, color: '#10B981' },
  ];

  const stages = pipeline && pipeline.length > 0 ? pipeline : defaultStages;

  const total = stages.reduce((s, x) => s + (x.count || 0), 0);
  const max = Math.max(...stages.map((s) => s.count || 0), 1);

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-base-c pb-3">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c">Leads by Pipeline Stage</h3>
        </div>
        <button
          onClick={onOpenPipeline}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
        >
          <span>Open Board</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Segmented Progress Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800 shadow-inner">
        {total > 0 ? (
          stages.map((s) => (
            <div
              key={s.stageName}
              style={{ width: `${((s.count || 0) / total) * 100}%`, backgroundColor: s.color || '#3b82f6' }}
              title={`${s.stageName}: ${s.count || 0}`}
            />
          ))
        ) : (
          <div className="w-full bg-slate-200/50 dark:bg-ink-700/40" />
        )}
      </div>

      <div className="space-y-3 pt-1">
        {stages.map((s) => {
          const count = s.count || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s.stageName} className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#3b82f6' }}
                />
                <span className="text-xs font-bold text-primary-c flex-1">{s.stageName}</span>
                <Badge variant="neutral" className="text-[10px] font-bold">
                  {pct}% ({count})
                </Badge>
              </div>
              <BarRow
                label=""
                value={count}
                max={max}
                color={s.color || '#3b82f6'}
                rightLabel={`${count} leads`}
              />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
