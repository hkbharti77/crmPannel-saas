import { GlassCard, Badge } from '@/components/ui/primitives';
import { Sparkline } from '@/components/ui/charts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Trophy,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

type KPI = {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: string;
  spark: number[];
};

const KPIS: KPI[] = [
  {
    id: 'revenue',
    label: 'Revenue (MTD)',
    value: '₹4,82,300',
    change: 12.4,
    icon: DollarSign,
    color: '#2563EB',
    spark: [30, 38, 34, 48, 52, 49, 60, 64, 58, 72],
  },
  {
    id: 'leads',
    label: 'New Leads',
    value: '1,284',
    change: 8.1,
    icon: Users,
    color: '#7C3AED',
    spark: [20, 24, 22, 30, 28, 35, 40, 38, 44, 50],
  },
  {
    id: 'chats',
    label: 'WhatsApp Chats',
    value: '3,642',
    change: -2.3,
    icon: MessageSquare,
    color: '#10B981',
    spark: [60, 58, 55, 52, 56, 50, 48, 52, 49, 47],
  },
  {
    id: 'won',
    label: 'Deals Won',
    value: '386',
    change: 18.7,
    icon: Trophy,
    color: '#F59E0B',
    spark: [10, 14, 12, 18, 20, 19, 24, 28, 30, 34],
  },
];

export function KpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((k) => {
        const Icon = k.icon;
        const up = k.change >= 0;
        return (
          <GlassCard key={k.id} hover className="p-5">
            <div className="flex items-start justify-between">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl2"
                style={{ backgroundColor: `${k.color}1a` }}
              >
                <Icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <Badge variant={up ? 'success' : 'danger'}>
                {up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(k.change)}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-secondary-c">{k.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary-c tabular-nums">
                {k.value}
              </p>
            </div>
            <div className="mt-3 h-9">
              <Sparkline
                data={k.spark}
                color={k.color}
                className="h-full w-full"
              />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export { type KPI };
