import { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { AreaChart } from '@/components/ui/charts';
import { cx } from '@/lib/types';
import { TrendingUp, MoreHorizontal } from 'lucide-react';

const RANGES = ['7D', '30D', '90D', '1Y'] as const;
type Range = (typeof RANGES)[number];

const DATASETS: Record<Range, { values: number[]; labels: string[]; total: string; change: number }> = {
  '7D': {
    values: [28, 35, 32, 42, 38, 48, 52],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    total: '₹1,24,500',
    change: 9.2,
  },
  '30D': {
    values: [30, 38, 34, 48, 52, 49, 60, 64, 58, 72, 68, 75, 80, 76, 84, 88, 82, 90, 86, 94, 92, 98, 96, 102, 100, 108, 112, 106, 116, 120],
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    total: '₹4,82,300',
    change: 12.4,
  },
  '90D': {
    values: Array.from({ length: 90 }, (_, i) => 20 + Math.floor(i * 2.5)),
    labels: Array.from({ length: 90 }, (_, i) => `${i + 1}`),
    total: '₹12,84,000',
    change: 24.8,
  },
  '1Y': {
    values: [120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    total: '₹48,92,000',
    change: 137.5,
  },
};

export function SalesChart() {
  const [range, setRange] = useState<Range>('30D');
  const data = DATASETS[range];

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary-c">Sales Performance</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-primary-c tabular-nums">
              {data.total}
            </span>
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" /> {data.change}%
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
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:text-primary-c">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <AreaChart
          data={data.values}
          height={200}
          className="w-full"
          showDots={data.values.length <= 12}
        />
      </div>

      <div className="mt-3 flex justify-between px-2">
        {data.labels
          .filter((_, i) => {
            const len = data.labels.length;
            if (len <= 7) return true;
            if (len <= 12) return true;
            return i % Math.ceil(len / 8) === 0;
          })
          .map((label, i) => (
            <span key={i} className="text-[10px] font-medium text-muted-c">
              {label}
            </span>
          ))}
      </div>
    </GlassCard>
  );
}
