import { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { AreaChart } from '@/components/ui/charts';
import { cx } from '@/lib/types';
import { TrendingUp } from 'lucide-react';
import type { RevenueReportDTO } from '@/lib/dashboardApi';

const RANGES = ['7D', '30D', '90D', '1Y'] as const;
type Range = (typeof RANGES)[number];

export function SalesChart({ revenueReport }: { revenueReport?: RevenueReportDTO }) {
  const [range, setRange] = useState<Range>('30D');

  const totalRev = revenueReport?.receivedRevenue || revenueReport?.totalPipelineValue || 0;
  const formattedTotal = `₹${totalRev.toLocaleString('en-IN')}`;

  const values = [0, 0, 0, 0, 0, 0, 0];

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary-c">Sales Performance</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-primary-c tabular-nums">
              {formattedTotal}
            </span>
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" /> 0%
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex rounded-lg border border-base-c p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cx(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  range === r
                    ? 'bg-gradient-accent text-white'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AreaChart data={values} height={200} showDots className="w-full" />
    </GlassCard>
  );
}
