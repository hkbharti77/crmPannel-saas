import {
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export type BroadcastStatus = 'sent' | 'scheduled' | 'draft' | 'failed';

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  audience: string;
  recipients: number;
  status: BroadcastStatus;
  sentAt: string;
  delivered: number;
  read: number;
  responded: number;
  channel: 'whatsapp' | 'sms' | 'email';
  template: string;
};

export const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string; icon: LucideIcon }
> = {
  sent: {
    label: 'Sent',
    color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    dot: 'bg-success-500',
    icon: CheckCircle2,
  },
  SENT: {
    label: 'Sent',
    color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    dot: 'bg-success-500',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    dot: 'bg-success-500',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    dot: 'bg-success-500',
    icon: CheckCircle2,
  },
  running: {
    label: 'Running',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: Clock,
  },
  RUNNING: {
    label: 'Running',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    dot: 'bg-primary-500',
    icon: Clock,
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    dot: 'bg-primary-500',
    icon: Clock,
  },
  draft: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: Megaphone,
  },
  DRAFT: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: Megaphone,
  },
  failed: {
    label: 'Failed',
    color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
    dot: 'bg-danger-500',
    icon: AlertCircle,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
    dot: 'bg-danger-500',
    icon: AlertCircle,
  },
  paused: {
    label: 'Paused',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  PAUSED: {
    label: 'Paused',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  queued: {
    label: 'Queued',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    dot: 'bg-purple-500',
    icon: Clock,
  },
  QUEUED: {
    label: 'Queued',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    dot: 'bg-purple-500',
    icon: Clock,
  },
};

export const CHANNEL_META: Record<
  Broadcast['channel'],
  { label: string; color: string; icon: LucideIcon }
> = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: MessageSquare },
  sms: { label: 'SMS', color: '#F22F46', icon: Send },
  email: { label: 'Email', color: '#4285F4', icon: Send },
};

export const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All Leads', count: 0 },
  { id: 'new', label: 'New Leads (this week)', count: 0 },
  { id: 'hot', label: 'Hot Leads', count: 0 },
  { id: 'warm', label: 'Warm Leads', count: 0 },
  { id: 'inactive', label: 'Inactive (30+ days)', count: 0 },
  { id: 'appointment', label: 'Upcoming Appointment', count: 0 },
];

export const TEMPLATES = [
  { id: 'none', label: 'Custom Message', text: '' },
  {
    id: 'greeting',
    label: 'Festive Greeting',
    text: 'Hi {{name}}, wishing you and your family a joyous festive season! May your new home bring you prosperity and happiness. - Metro Realty',
  },
  {
    id: 'project',
    label: 'New Project Launch',
    text: 'Hi {{name}}, we just launched our premium 2/3 BHK homes at Skyline Residences. Limited pre-launch pricing available. Reply to schedule a site visit!',
  },
  {
    id: 'followup',
    label: 'Follow-up Reminder',
    text: 'Hi {{name}}, just following up on your interest in our properties. Would you like to schedule a call with our advisor this week?',
  },
  {
    id: 'offer',
    label: 'Special Offer',
    text: 'Hi {{name}}, exclusive offer for you! Zero stamp duty on select properties this month. Limited inventory. Reply OFFER to learn more.',
  },
];

export const BROADCASTS: Broadcast[] = [];
