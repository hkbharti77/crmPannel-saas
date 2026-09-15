import { GlassCard, Badge } from '@/components/ui/primitives';
import { Sparkline } from '@/components/ui/charts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  LifeBuoy,
  Trophy,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardAggregateDTO } from '@/lib/dashboardApi';

type KPI = {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: string;
  spark: number[];
  badgeText?: string;
};

export function KpiGrid({ data }: { data?: DashboardAggregateDTO | null }) {
  const rev = data?.revenueReport?.receivedRevenue ?? 0;
  const leads = data?.totalLeads ?? 0;
  const tickets = data?.openTickets ?? 0;
  const closed = data?.closedLeads ?? 0;

  const kpis: KPI[] = [
    {
      id: 'revenue',
      label: 'Revenue (MTD)',
      value: `₹${Number(rev).toLocaleString('en-IN')}`,
      change: 14.8,
      icon: DollarSign,
      color: '#2563EB',
      spark: rev > 0 ? [10, 25, 40, 60, rev] : [0, 0, 0, 0, 0],
      badgeText: 'Received Payments',
    },
    {
      id: 'leads',
      label: 'Total Active Leads',
      value: Number(leads).toLocaleString('en-IN'),
      change: 8.2,
      icon: Users,
      color: '#7C3AED',
      spark: leads > 0 ? [5, 12, 20, 35, leads] : [0, 0, 0, 0, 0],
      badgeText: 'Pipeline Contacts',
    },
    {
      id: 'tickets',
      label: 'Open Support Tickets',
      value: Number(tickets).toLocaleString('en-IN'),
      change: -4.5,
      icon: LifeBuoy,
      color: '#10B981',
      spark: tickets > 0 ? [1, 2, 3, tickets] : [0, 0, 0, 0, 0],
      badgeText: 'Helpdesk Queue',
    },
    {
      id: 'closed',
      label: 'Closed / Deals Won',
      value: Number(closed).toLocaleString('en-IN'),
      change: 12.4,
      icon: Trophy,
      color: '#F59E0B',
      spark: closed > 0 ? [2, 5, 8, closed] : [0, 0, 0, 0, 0],
      badgeText: 'Won Conversions',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const Icon = k.icon;
        const up = k.change >= 0;
        return (
          <GlassCard key={k.id} className="p-5 relative overflow-hidden transition-all duration-200 hover:shadow-md group">
            <div className="flex items-start justify-between">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl shadow-xs transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${k.color}1c`, borderColor: `${k.color}30` }}
              >
                <Icon className="h-5.5 w-5.5" style={{ color: k.color }} />
              </div>
              <Badge variant={up ? 'success' : 'neutral'} className="px-2.5 py-0.5 text-[10px] font-bold">
                {up ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(k.change)}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-c">{k.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary-c tabular-nums">
                {k.value}
              </p>
            </div>
            <div className="mt-3 h-9">
              <Sparkline
                data={k.spark}
                color={k.color}
                height={36}
                strokeWidth={2.5}
                className="w-full"
              />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
