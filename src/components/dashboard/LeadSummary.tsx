import { GlassCard, Badge } from '@/components/ui/primitives';
import { BarRow } from '@/components/ui/charts';
import type { LeadStage } from '@/lib/types';
import { KanbanSquare, ArrowRight } from 'lucide-react';

const STAGES: { stage: LeadStage; count: number; color: string }[] = [
  { stage: 'NEW', count: 142, color: 'bg-primary-500' },
  { stage: 'CONTACTED', count: 98, color: 'bg-secondary-500' },
  { stage: 'QUALIFIED', count: 64, color: 'bg-warning-500' },
  { stage: 'WON', count: 386, color: 'bg-success-500' },
  { stage: 'LOST', count: 47, color: 'bg-danger-500' },
];

export function LeadSummary({ onOpenPipeline }: { onOpenPipeline: () => void }) {
  const total = STAGES.reduce((s, x) => s + x.count, 0);
  const max = Math.max(...STAGES.map((s) => s.count));

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

      <div className="mb-5 flex h-2.5 w-full overflow-hidden rounded-full">
        {STAGES.map((s) => (
          <div
            key={s.stage}
            className={s.color}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.stage}: ${s.count}`}
          />
        ))}
      </div>

      <div className="space-y-3.5">
        {STAGES.map((s) => (
          <div key={s.stage}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-xs font-medium text-secondary-c">{s.stage}</span>
              <Badge variant="neutral" className="ml-auto">
                {Math.round((s.count / total) * 100)}%
              </Badge>
            </div>
            <BarRow
              label=""
              value={s.count}
              max={max}
              color={s.color}
              rightLabel={`${s.count} leads`}
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
