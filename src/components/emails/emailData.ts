export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow_up' | 'welcome' | 'promotion' | 'announcement' | 'nurture';
};

export type Audience = {
  id: string;
  name: string;
  count: number;
  description: string;
  tags: string[];
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending' | 'paused' | 'cancelled' | 'failed' | 'completed';
  recipients: number; // processedRecipients / totalRecipients mapped on UI side
  totalRecipients?: number;
  processedRecipients?: number;
  openRate: number;
  clickRate: number;
  uniqueOpens?: number;
  uniqueClicks?: number;
  bounces?: number;
  unsubscribes?: number;
  clickToOpenRate?: number;
  bounceRate?: number;
  unsubscribeRate?: number;
  totalSent?: number;
  totalFailed?: number;
  createdAt?: string;
  sentAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
  template: string;
};

export const TEMPLATES: EmailTemplate[] = [];

export const AUDIENCES: Audience[] = [];

export const CAMPAIGNS: Campaign[] = [];

export const CAMPAIGN_STATUS_META: Record<Campaign['status'], { label: string; color: string; dot: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400', dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  sent: { label: 'Sent', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  completed: { label: 'Completed', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  sending: { label: 'Sending', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  paused: { label: 'Paused', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300', dot: 'bg-slate-500' },
  cancelled: { label: 'Cancelled', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300', dot: 'bg-danger-500' },
  failed: { label: 'Failed', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300', dot: 'bg-danger-500' },
};

export const TEMPLATE_CATEGORY_META: Record<EmailTemplate['category'], { label: string; color: string }> = {
  follow_up: { label: 'Follow Up', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  welcome: { label: 'Welcome', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  promotion: { label: 'Promotion', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  announcement: { label: 'Announcement', color: 'bg-secondary-500/15 text-secondary-700 dark:text-secondary-300' },
  nurture: { label: 'Nurture', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
};
