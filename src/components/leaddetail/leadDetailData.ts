import type { LeadStage } from '@/lib/types';

export type TimelineEvent = {
  id: string;
  type: 'chat' | 'call' | 'email' | 'appointment' | 'note' | 'stage_change' | 'won' | 'lead_created';
  title: string;
  description: string;
  actor: string;
  time: string;
};

export type Note = {
  id: string;
  text: string;
  author: string;
  time: string;
};

export type LeadFile = {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'sheet';
  size: string;
  uploadedBy: string;
  time: string;
};

export type LeadDetailData = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  stage: LeadStage;
  value: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  budget: string;
  interest: string;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  quality: 'GREEN' | 'YELLOW' | 'RED';
  timeline: TimelineEvent[];
  notes: Note[];
  files: LeadFile[];
};

export const LEAD_DETAIL: LeadDetailData = {
  id: '',
  name: '',
  company: '',
  phone: '',
  email: '',
  location: '',
  stage: 'NEW',
  value: '₹0',
  priority: 'LOW',
  source: '',
  budget: '',
  interest: '',
  assignedTo: '',
  createdAt: '',
  lastActivity: '',
  tags: [],
  sentiment: 'Neutral',
  quality: 'GREEN',
  timeline: [],
  notes: [],
  files: [],
};

export const STAGE_ORDER: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON'];

export const FILE_ICONS: Record<LeadFile['type'], { icon: string; color: string }> = {
  pdf: { icon: 'FileText', color: 'text-danger-600 dark:text-danger-400' },
  image: { icon: 'Image', color: 'text-success-600 dark:text-success-400' },
  doc: { icon: 'FileType', color: 'text-primary-600 dark:text-primary-400' },
  sheet: { icon: 'Sheet', color: 'text-success-600 dark:text-success-400' },
};
