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
  const stages = pipeline.length > 0
    ? pipeline
    : [
        { stageName: 'New Leads', count: 8, color: '#2563EB' },
        { stageName: 'Interested', count: 5, color: '#0EA5E9' },
        { stageName: 'Follow Up Needed', count: 4, color: '#F59E0B' },
        { stageName: 'Closed Won', count: 6, color: '#10B981' },
      ];

  const total = stages.reduce((s, x) => s + x.count, 0);
  const max = Math.max(...stages.map((s) => s.count), 1);

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
        {total > 0 &&
          stages.map((s) => (
            <div
              key={s.stageName}
              style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color || '#3b82f6' }}
              title={`${s.stageName}: ${s.count}`}
            />
          ))}
      </div>

      <div className="space-y-3 pt-1">
        {stages.map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.stageName} className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#3b82f6' }}
                />
                <span className="text-xs font-bold text-primary-c flex-1">{s.stageName}</span>
                <Badge variant="neutral" className="text-[10px] font-bold">
                  {pct}% ({s.count})
                </Badge>
              </div>
              <BarRow
                label=""
                value={s.count}
                max={max}
                color={s.color || '#3b82f6'}
                rightLabel={`${s.count} leads`}
              />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
