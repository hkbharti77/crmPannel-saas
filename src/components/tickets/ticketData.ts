import type { TicketStatus, TicketPriority } from '@/lib/types';

export type TicketCategory = 'technical' | 'billing' | 'general' | 'feature_request' | 'bug';

export type TicketComment = {
  id: string;
  author: string;
  isAgent: boolean;
  text: string;
  time: string;
};

export type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  requester: string;
  requesterEmail: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
};

export const STATUS_META: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Open', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  RESOLVED: { label: 'Resolved', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400', dot: 'bg-slate-400' },
};

export const PRIORITY_META: Record<TicketPriority, { label: string; color: string; ring: string }> = {
  LOW: { label: 'Low', color: 'text-slate-600 dark:text-slate-400', ring: 'border-l-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-primary-600 dark:text-primary-400', ring: 'border-l-primary-500' },
  HIGH: { label: 'High', color: 'text-warning-600 dark:text-warning-400', ring: 'border-l-warning-500' },
  URGENT: { label: 'Urgent', color: 'text-danger-600 dark:text-danger-400', ring: 'border-l-danger-500' },
};

export const CATEGORY_META: Record<TicketCategory, { label: string; icon: string }> = {
  technical: { label: 'Technical', icon: 'Cog' },
  billing: { label: 'Billing', icon: 'CreditCard' },
  general: { label: 'General', icon: 'MessageCircle' },
  feature_request: { label: 'Feature Request', icon: 'Lightbulb' },
  bug: { label: 'Bug Report', icon: 'Bug' },
};

export const TICKETS: Ticket[] = [];
