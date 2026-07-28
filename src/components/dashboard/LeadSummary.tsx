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
        { stageName: 'New', count: 0, color: '#94A3B8' },
        { stageName: 'Interested', count: 0, color: '#0EA5E9' },
        { stageName: 'Follow Up', count: 0, color: '#F59E0B' },
        { stageName: 'Won', count: 0, color: '#10B981' },
      ];

  const total = stages.reduce((s, x) => s + x.count, 0);
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-primary-c">Leads by Stage</h3>
        </div>
        <button
          onClick={onOpenPipeline}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View board <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
        {total > 0 &&
          stages.map((s) => (
            <div
              key={s.stageName}
              style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color || '#3b82f6' }}
              title={`${s.stageName}: ${s.count}`}
            />
          ))}
      </div>

      <div className="space-y-3.5">
        {stages.map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.stageName}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color || '#3b82f6' }}
                />
                <span className="text-xs font-medium text-secondary-c">{s.stageName}</span>
                <Badge variant="neutral" className="ml-auto">
                  {pct}%
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

