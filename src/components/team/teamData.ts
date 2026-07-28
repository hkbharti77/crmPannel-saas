export type AgentStatus = 'ACTIVE' | 'AWAY' | 'OFFLINE';
export type AgentRole = 'Owner' | 'Admin' | 'Agent' | 'Team Lead' | 'Senior Agent' | 'Junior Agent';

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

export const AGENTS: Agent[] = [];

export const STATUS_META: Record<AgentStatus, { label: string; dot: string; color: string }> = {
  ACTIVE: { label: 'Active', dot: 'bg-success-500', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  AWAY: { label: 'Away', dot: 'bg-warning-500', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  OFFLINE: { label: 'Offline', dot: 'bg-slate-400', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400' },
};

export const ROLE_META: Record<AgentRole, { color: string }> = {
  'Owner': { color: 'bg-amber-500 text-white' },
  'Admin': { color: 'bg-gradient-accent text-white' },
  'Team Lead': { color: 'bg-gradient-accent text-white' },
  'Senior Agent': { color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300' },
  'Agent': { color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  'Junior Agent': { color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400' },
};
