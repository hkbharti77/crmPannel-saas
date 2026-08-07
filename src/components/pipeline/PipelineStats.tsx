import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { TrendingUp, DollarSign, Target, Flame, BarChart3 } from 'lucide-react';
import type { Lead } from './pipelineData';

export function PipelineStats({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const wonValue = leads
    .filter((l) => l.stage === 'WON')
    .reduce((s, l) => s + parseValue(l.value), 0);
  const qualifiedValue = leads
    .filter((l) => l.stage === 'QUALIFIED')
    .reduce((s, l) => s + parseValue(l.value), 0);
  const hotCount = leads.filter((l) => l.tags.includes('HOT')).length;
  const winRate = total > 0 ? Math.round((leads.filter((l) => l.stage === 'WON').length / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Leads',
      value: String(total),
      icon: Target,
      color: '#2563EB',
      bg: 'rgba(37,99,235,0.10)',
    },
    {
      label: 'Pipeline Value',
      value: formatCr(qualifiedValue),
      icon: DollarSign,
      color: '#7C3AED',
      bg: 'rgba(124,58,237,0.10)',
      sub: 'Qualified deals',
    },
    {
      label: 'Won Revenue',
      value: formatCr(wonValue),
      icon: TrendingUp,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.10)',
      sub: `${winRate}% win rate`,
    },
    {
      label: 'Hot Leads',
      value: String(hotCount),
      icon: Flame,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.10)',
      sub: 'Need attention',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <GlassCard key={s.label} className="flex items-center gap-3 p-4">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2"
              style={{ backgroundColor: s.bg }}
            >
              <Icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-secondary-c">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold text-primary-c tabular-nums">{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted-c">{s.sub}</p>}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function parseValue(v: string): number {
  if (!v) return 0;
  if (v.includes('Cr')) return parseFloat(v.replace(/[₹Cr,]/g, '').trim()) * 100;
  if (v.includes('L')) return parseFloat(v.replace(/[₹L,]/g, '').trim());
  // Plain rupee amount like "₹7,000" or "₹60000" — convert to lakhs
  const plain = parseFloat(v.replace(/[₹,]/g, '').trim());
  return isNaN(plain) ? 0 : plain / 100_000;
}

function formatCr(lakhs: number): string {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)}Cr`;
  return `₹${lakhs.toFixed(0)}L`;
}

export { BarChart3 };
