export type ReportMetric = {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  spark: number[];
  color: string;
};

export const KPI_METRICS: ReportMetric[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '₹0',
    change: 0,
    trend: 'up',
    spark: [0, 0, 0, 0, 0, 0, 0],
    color: '#2563EB',
  },
  {
    id: 'deals',
    label: 'Deals Closed',
    value: '0',
    change: 0,
    trend: 'up',
    spark: [0, 0, 0, 0, 0, 0, 0],
    color: '#10b981',
  },
  {
    id: 'leads',
    label: 'New Leads',
    value: '0',
    change: 0,
    trend: 'up',
    spark: [0, 0, 0, 0, 0, 0, 0],
    color: '#f59e0b',
  },
  {
    id: 'conversion',
    label: 'Conversion Rate',
    value: '0%',
    change: 0,
    trend: 'up',
    spark: [0, 0, 0, 0, 0, 0, 0],
    color: '#ef4444',
  },
];

export const REVENUE_BY_MONTH = [
  { month: 'Jan', value: 0 },
  { month: 'Feb', value: 0 },
  { month: 'Mar', value: 0 },
  { month: 'Apr', value: 0 },
  { month: 'May', value: 0 },
  { month: 'Jun', value: 0 },
  { month: 'Jul', value: 0 },
];

export const LEAD_SOURCE_BREAKDOWN: { source: string; count: number; pct: number; color: string }[] = [];

export const AGENT_PERFORMANCE: { agent: string; deals: number; revenue: string; conv: number; spark: number[] }[] = [];

export const SALES_FUNNEL: { stage: string; count: number; pct: number }[] = [];
