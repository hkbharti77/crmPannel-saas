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
    value: '₹4,82,30,000',
    change: 12.4,
    trend: 'up',
    spark: [30, 38, 34, 48, 52, 49, 60, 64, 58, 72, 68, 75],
    color: '#2563EB',
  },
  {
    id: 'deals',
    label: 'Deals Closed',
    value: '142',
    change: 8.1,
    trend: 'up',
    spark: [10, 12, 9, 14, 16, 13, 18, 20, 17, 22, 19, 24],
    color: '#10b981',
  },
  {
    id: 'leads',
    label: 'New Leads',
    value: '1,284',
    change: 24.8,
    trend: 'up',
    spark: [45, 52, 48, 60, 70, 65, 80, 90, 85, 100, 110, 125],
    color: '#f59e0b',
  },
  {
    id: 'conversion',
    label: 'Conversion Rate',
    value: '11.06%',
    change: -2.3,
    trend: 'down',
    spark: [12, 13, 11, 12, 10, 11, 10, 11, 10, 9, 10, 11],
    color: '#ef4444',
  },
];

export const REVENUE_BY_MONTH = [
  { month: 'Jan', value: 28 },
  { month: 'Feb', value: 35 },
  { month: 'Mar', value: 32 },
  { month: 'Apr', value: 42 },
  { month: 'May', value: 38 },
  { month: 'Jun', value: 48 },
  { month: 'Jul', value: 52 },
];

export const LEAD_SOURCE_BREAKDOWN = [
  { source: 'WhatsApp', count: 482, pct: 38, color: 'bg-success-500' },
  { source: 'Website', count: 324, pct: 25, color: 'bg-primary-500' },
  { source: 'Referral', count: 256, pct: 20, color: 'bg-secondary-500' },
  { source: 'Cold Call', count: 128, pct: 10, color: 'bg-warning-500' },
  { source: 'Email', count: 94, pct: 7, color: 'bg-danger-500' },
];

export const AGENT_PERFORMANCE = [
  { agent: 'Priya Sharma', deals: 38, revenue: '₹1.42Cr', conv: 14.2, spark: [8, 10, 12, 11, 14, 16, 18] },
  { agent: 'Arjun Kapoor', deals: 32, revenue: '₹1.18Cr', conv: 12.8, spark: [6, 8, 9, 11, 10, 13, 14] },
  { agent: 'Sneha Patel', deals: 41, revenue: '₹1.65Cr', conv: 16.1, spark: [10, 12, 14, 16, 18, 20, 22] },
  { agent: 'Rahul Verma', deals: 31, revenue: '₹97L', conv: 10.5, spark: [7, 9, 8, 10, 12, 11, 13] },
];

export const SALES_FUNNEL = [
  { stage: 'Total Leads', count: 1284, pct: 100 },
  { stage: 'Contacted', count: 892, pct: 69 },
  { stage: 'Qualified', count: 410, pct: 32 },
  { stage: 'Site Visit', count: 218, pct: 17 },
  { stage: 'Closed Won', count: 142, pct: 11 },
];
