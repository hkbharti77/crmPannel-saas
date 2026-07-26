export type AgentStatus = 'ACTIVE' | 'AWAY' | 'OFFLINE';
export type AgentRole = 'Senior Agent' | 'Agent' | 'Junior Agent' | 'Team Lead';

export type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AgentRole;
  status: AgentStatus;
  avatar?: string;
  dealsClosed: number;
  activeLeads: number;
  revenue: string;
  conversion: number;
  joinedDate: string;
  rating: number;
  city: string;
};

export const AGENTS: Agent[] = [
  {
    id: 'A-01',
    name: 'Priya Sharma',
    email: 'priya.sharma@crmlite.io',
    phone: '+91 98765 43210',
    role: 'Team Lead',
    status: 'ACTIVE',
    dealsClosed: 38,
    activeLeads: 24,
    revenue: '₹1.42Cr',
    conversion: 14.2,
    joinedDate: 'Jan 2025',
    rating: 4.9,
    city: 'Hyderabad',
  },
  {
    id: 'A-02',
    name: 'Arjun Kapoor',
    email: 'arjun.kapoor@crmlite.io',
    phone: '+91 90123 45678',
    role: 'Senior Agent',
    status: 'ACTIVE',
    dealsClosed: 32,
    activeLeads: 18,
    revenue: '₹1.18Cr',
    conversion: 12.8,
    joinedDate: 'Mar 2025',
    rating: 4.7,
    city: 'Mumbai',
  },
  {
    id: 'A-03',
    name: 'Sneha Patel',
    email: 'sneha.patel@crmlite.io',
    phone: '+91 99876 54321',
    role: 'Senior Agent',
    status: 'AWAY',
    dealsClosed: 41,
    activeLeads: 21,
    revenue: '₹1.65Cr',
    conversion: 16.1,
    joinedDate: 'Feb 2025',
    rating: 4.8,
    city: 'Bengaluru',
  },
  {
    id: 'A-04',
    name: 'Rahul Verma',
    email: 'rahul.verma@crmlite.io',
    phone: '+91 88123 45678',
    role: 'Agent',
    status: 'ACTIVE',
    dealsClosed: 31,
    activeLeads: 27,
    revenue: '₹97L',
    conversion: 10.5,
    joinedDate: 'May 2025',
    rating: 4.5,
    city: 'Hyderabad',
  },
  {
    id: 'A-05',
    name: 'Kavya Reddy',
    email: 'kavya.reddy@crmlite.io',
    phone: '+91 91234 56789',
    role: 'Junior Agent',
    status: 'OFFLINE',
    dealsClosed: 12,
    activeLeads: 15,
    revenue: '₹42L',
    conversion: 7.8,
    joinedDate: 'Aug 2025',
    rating: 4.3,
    city: 'Bengaluru',
  },
  {
    id: 'A-06',
    name: 'Karthik Nair',
    email: 'karthik.nair@crmlite.io',
    phone: '+91 87654 32109',
    role: 'Agent',
    status: 'ACTIVE',
    dealsClosed: 28,
    activeLeads: 22,
    revenue: '₹88L',
    conversion: 11.2,
    joinedDate: 'Apr 2025',
    rating: 4.6,
    city: 'Mumbai',
  },
];

export const STATUS_META: Record<AgentStatus, { label: string; dot: string; color: string }> = {
  ACTIVE: { label: 'Active', dot: 'bg-success-500', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  AWAY: { label: 'Away', dot: 'bg-warning-500', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  OFFLINE: { label: 'Offline', dot: 'bg-slate-400', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400' },
};

export const ROLE_META: Record<AgentRole, { color: string }> = {
  'Team Lead': { color: 'bg-gradient-accent text-white' },
  'Senior Agent': { color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300' },
  'Agent': { color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  'Junior Agent': { color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400' },
};
