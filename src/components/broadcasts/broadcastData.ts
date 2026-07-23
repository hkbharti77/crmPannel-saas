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
  BroadcastStatus,
  { label: string; color: string; dot: string; icon: LucideIcon }
> = {
  sent: {
    label: 'Sent',
    color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    dot: 'bg-success-500',
    icon: CheckCircle2,
  },
  scheduled: {
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
  failed: {
    label: 'Failed',
    color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
    dot: 'bg-danger-500',
    icon: AlertCircle,
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
  { id: 'all', label: 'All Leads', count: 291 },
  { id: 'new', label: 'New Leads (this week)', count: 18 },
  { id: 'hot', label: 'Hot Leads', count: 34 },
  { id: 'warm', label: 'Warm Leads', count: 87 },
  { id: 'inactive', label: 'Inactive (30+ days)', count: 65 },
  { id: 'appointment', label: 'Upcoming Appointment', count: 12 },
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

export const BROADCASTS: Broadcast[] = [
  {
    id: 'BC-1001',
    title: 'Diwali Greeting Campaign',
    message: 'Hi {{name}}, wishing you and your family a joyous Diwali! May your new home bring you prosperity and happiness. - Metro Realty',
    audience: 'All Leads',
    recipients: 291,
    status: 'sent',
    sentAt: 'Oct 28, 2025 10:00 AM',
    delivered: 287,
    read: 212,
    responded: 48,
    channel: 'whatsapp',
    template: 'Festive Greeting',
  },
  {
    id: 'BC-1002',
    title: 'Skyline Residences Launch',
    message: 'Hi {{name}}, we just launched our premium 2/3 BHK homes at Skyline Residences. Limited pre-launch pricing available. Reply to schedule a site visit!',
    audience: 'Hot Leads',
    recipients: 34,
    status: 'sent',
    sentAt: 'Nov 15, 2025 4:30 PM',
    delivered: 33,
    read: 28,
    responded: 15,
    channel: 'whatsapp',
    template: 'New Project Launch',
  },
  {
    id: 'BC-1003',
    title: 'Weekend Site Visit Drive',
    message: 'Hi {{name}}, visit Skyline Residences this weekend and get a free consultation with our senior advisor. Slots filling fast!',
    audience: 'Warm Leads',
    recipients: 87,
    status: 'scheduled',
    sentAt: 'Scheduled: Nov 22, 2025 9:00 AM',
    delivered: 0,
    read: 0,
    responded: 0,
    channel: 'whatsapp',
    template: 'Custom Message',
  },
  {
    id: 'BC-1004',
    title: 'Zero Stamp Duty Offer',
    message: 'Hi {{name}}, exclusive offer for you! Zero stamp duty on select properties this month. Limited inventory. Reply OFFER to learn more.',
    audience: 'Hot Leads + Warm Leads',
    recipients: 121,
    status: 'draft',
    sentAt: 'Not sent yet',
    delivered: 0,
    read: 0,
    responded: 0,
    channel: 'whatsapp',
    template: 'Special Offer',
  },
  {
    id: 'BC-1005',
    title: 'Year-End Property Expo Invite',
    message: 'Hi {{name}}, join us at the Mumbai Property Expo Dec 10-12. Free entry, exclusive deals on ready-to-move homes!',
    audience: 'All Leads',
    recipients: 291,
    status: 'failed',
    sentAt: 'Failed: Dec 5, 2025 2:00 PM',
    delivered: 0,
    read: 0,
    responded: 0,
    channel: 'sms',
    template: 'Custom Message',
  },
  {
    id: 'BC-1006',
    title: 'Follow-up Campaign Q4',
    message: 'Hi {{name}}, just following up on your interest in our properties. Would you like to schedule a call with our advisor this week?',
    audience: 'Inactive (30+ days)',
    recipients: 65,
    status: 'sent',
    sentAt: 'Dec 8, 2025 11:00 AM',
    delivered: 63,
    read: 41,
    responded: 9,
    channel: 'whatsapp',
    template: 'Follow-up Reminder',
  },
];
