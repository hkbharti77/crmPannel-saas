import type { LeadStage } from '@/lib/types';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type LeadSource = 'WhatsApp' | 'Website' | 'Referral' | 'Cold Call' | 'Email';

export type Lead = {
  id: string;
  name: string;
  company: string;
  phone: string;
  avatar?: string;
  stage: LeadStage;
  value: string;
  priority: Priority;
  score?: number;
  source: LeadSource;
  tags: string[];
  assignedTo: string;
  lastActivity: string;
  nextAction: string;
  nextActionDate: string;
  hasUnread: boolean;
};

export const LEADS: Lead[] = [];

export const STAGE_CONFIG: { stage: LeadStage; title: string; color: string; barColor: string; accent: string }[] = [
  { stage: 'NEW', title: 'New', color: 'text-primary-600 dark:text-primary-400', barColor: 'bg-primary-500', accent: 'rgba(37,99,235,0.08)' },
  { stage: 'CONTACTED', title: 'Contacted', color: 'text-secondary-600 dark:text-secondary-400', barColor: 'bg-secondary-500', accent: 'rgba(124,58,237,0.08)' },
  { stage: 'QUALIFIED', title: 'Qualified', color: 'text-warning-600 dark:text-warning-400', barColor: 'bg-warning-500', accent: 'rgba(245,158,11,0.08)' },
  { stage: 'WON', title: 'Won', color: 'text-success-600 dark:text-success-400', barColor: 'bg-success-500', accent: 'rgba(16,185,129,0.08)' },
  { stage: 'LOST', title: 'Lost', color: 'text-danger-600 dark:text-danger-400', barColor: 'bg-danger-500', accent: 'rgba(239,68,68,0.08)' },
];

export const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
  MEDIUM: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  LOW: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400',
};
