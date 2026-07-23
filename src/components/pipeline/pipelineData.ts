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
  source: LeadSource;
  tags: string[];
  assignedTo: string;
  lastActivity: string;
  nextAction: string;
  nextActionDate: string;
  hasUnread: boolean;
};

export const LEADS: Lead[] = [
  // NEW
  { id: 'l1', name: 'Rajesh Mehta', company: 'Metro Realty', phone: '+91 98765 43210', stage: 'NEW', value: '₹68L', priority: 'HIGH', source: 'WhatsApp', tags: ['HOT'], assignedTo: 'Priya', lastActivity: '2m ago', nextAction: 'Site visit', nextActionDate: 'Sat 10AM', hasUnread: true },
  { id: 'l2', name: 'Kavya Reddy', company: 'Reddy Constructions', phone: '+91 90123 45678', stage: 'NEW', value: '₹45L', priority: 'MEDIUM', source: 'Website', tags: [], assignedTo: 'Arjun', lastActivity: '32m ago', nextAction: 'Follow-up call', nextActionDate: 'Today 4PM', hasUnread: true },
  { id: 'l3', name: 'Deepika Nair', company: 'Nair Properties', phone: '+91 99876 54321', stage: 'NEW', value: '₹52L', priority: 'LOW', source: 'Referral', tags: [], assignedTo: 'Rahul', lastActivity: '2h ago', nextAction: 'Send brochure', nextActionDate: 'Tomorrow', hasUnread: false },

  // CONTACTED
  { id: 'l4', name: 'Sunil Group', company: 'Sunil Enterprises', phone: '+91 99887 65432', stage: 'CONTACTED', value: '₹1.2Cr', priority: 'HIGH', source: 'WhatsApp', tags: ['VIP'], assignedTo: 'Priya', lastActivity: '15m ago', nextAction: 'Schedule demo', nextActionDate: 'Today 5PM', hasUnread: false },
  { id: 'l5', name: 'Nisha Agarwal', company: 'Agarwal Estates', phone: '+91 98300 11223', stage: 'CONTACTED', value: '₹75L', priority: 'HIGH', source: 'Cold Call', tags: ['HOT'], assignedTo: 'Sneha', lastActivity: '8h ago', nextAction: 'Callback', nextActionDate: 'Today 3PM', hasUnread: false },
  { id: 'l6', name: 'Meera Iyer', company: 'Iyer Group', phone: '+91 88123 45678', stage: 'CONTACTED', value: '₹38L', priority: 'MEDIUM', source: 'Email', tags: [], assignedTo: 'Arjun', lastActivity: '5h ago', nextAction: 'Share pricing', nextActionDate: 'Tomorrow', hasUnread: false },

  // QUALIFIED
  { id: 'l7', name: 'Ananya Builders', company: 'Ananya Corp', phone: '+91 88765 11122', stage: 'QUALIFIED', value: '₹95L', priority: 'HIGH', source: 'WhatsApp', tags: ['VIP', 'RETURNING'], assignedTo: 'Arjun', lastActivity: '8m ago', nextAction: 'Send proposal', nextActionDate: 'Today 6PM', hasUnread: false },
  { id: 'l8', name: 'Karthik Solutions', company: 'Karthik Tech', phone: '+91 87612 99887', stage: 'QUALIFIED', value: '₹62L', priority: 'MEDIUM', source: 'Website', tags: [], assignedTo: 'Sneha', lastActivity: '6h ago', nextAction: 'Negotiation call', nextActionDate: 'Tomorrow 11AM', hasUnread: false },

  // WON
  { id: 'l9', name: 'Metro Realty', company: 'Metro Group', phone: '+91 91234 56789', stage: 'WON', value: '₹1.2Cr', priority: 'HIGH', source: 'WhatsApp', tags: ['VIP'], assignedTo: 'Sneha', lastActivity: '1h ago', nextAction: 'Collect payment', nextActionDate: 'Tomorrow', hasUnread: false },
  { id: 'l10', name: 'Apex Housing', company: 'Apex Ltd', phone: '+91 90987 65432', stage: 'WON', value: '₹85L', priority: 'HIGH', source: 'Referral', tags: ['VIP'], assignedTo: 'Sneha', lastActivity: '5h ago', nextAction: 'Sign agreement', nextActionDate: 'Fri 2PM', hasUnread: false },
  { id: 'l11', name: 'Rohan Desai', company: 'Desai Realty', phone: '+91 90011 22334', stage: 'WON', value: '₹48L', priority: 'MEDIUM', source: 'Website', tags: [], assignedTo: 'Rahul', lastActivity: '1d ago', nextAction: 'Handover docs', nextActionDate: 'Next week', hasUnread: false },

  // LOST
  { id: 'l12', name: 'Vikram Singh', company: 'Singh Properties', phone: '+91 87654 32109', stage: 'LOST', value: '₹40L', priority: 'LOW', source: 'Cold Call', tags: [], assignedTo: 'Arjun', lastActivity: '3d ago', nextAction: '—', nextActionDate: '—', hasUnread: false },
];

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
