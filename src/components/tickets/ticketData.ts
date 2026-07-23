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

export const TICKETS: Ticket[] = [
  {
    id: 'TK-001',
    subject: 'WhatsApp bot not responding to messages',
    description: 'Our WhatsApp chatbot has stopped responding to incoming customer messages since this morning. Messages are being received but no auto-reply is being sent. This is affecting lead capture.',
    category: 'technical',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    requester: 'Priya Sharma',
    requesterEmail: 'priya@metrorealty.com',
    assignedTo: 'Arjun Kapoor',
    createdAt: 'Jul 22, 09:15',
    updatedAt: '20 min ago',
    comments: [
      { id: 'c1', author: 'Priya Sharma', isAgent: false, text: 'The bot was working fine yesterday. No changes were made to the configuration. Please look into this urgently as we are losing leads.', time: 'Jul 22, 09:15' },
      { id: 'c2', author: 'Arjun Kapoor', isAgent: true, text: 'Hi Priya, I am looking into this now. Can you confirm if you see any error messages in the bot dashboard?', time: 'Jul 22, 09:30' },
      { id: 'c3', author: 'Priya Sharma', isAgent: false, text: 'No errors visible in the dashboard. It just shows messages as received but no outgoing replies.', time: 'Jul 22, 09:35' },
      { id: 'c4', author: 'Arjun Kapoor', isAgent: true, text: 'I have identified the issue — it looks like the webhook endpoint is timing out. I am restarting the service and will update you shortly.', time: 'Jul 22, 09:45' },
    ],
  },
  {
    id: 'TK-002',
    subject: 'Cannot export lead data to CSV',
    description: 'The export button on the pipeline page is not generating any file. Clicking it does nothing.',
    category: 'bug',
    status: 'OPEN',
    priority: 'HIGH',
    requester: 'Sneha Patel',
    requesterEmail: 'sneha@metrorealty.com',
    assignedTo: 'Rahul Verma',
    createdAt: 'Jul 22, 11:20',
    updatedAt: '2 hours ago',
    comments: [
      { id: 'c1', author: 'Sneha Patel', isAgent: false, text: 'I have tried multiple times to export leads from the pipeline view but nothing happens. No download starts.', time: 'Jul 22, 11:20' },
    ],
  },
  {
    id: 'TK-003',
    subject: 'Request: Custom fields for leads',
    description: 'We would like to add custom fields to lead profiles — specifically property type preference and budget range dropdowns.',
    category: 'feature_request',
    status: 'OPEN',
    priority: 'MEDIUM',
    requester: 'Arjun Kapoor',
    requesterEmail: 'arjun@metrorealty.com',
    assignedTo: 'Priya Sharma',
    createdAt: 'Jul 21, 14:00',
    updatedAt: '1 day ago',
    comments: [
      { id: 'c1', author: 'Arjun Kapoor', isAgent: true, text: 'Would it be possible to add custom fields for property type and budget range? This would help our agents filter leads more effectively.', time: 'Jul 21, 14:00' },
      { id: 'c2', author: 'Priya Sharma', isAgent: false, text: 'Great suggestion! I will add this to our product roadmap. Can you share the specific field types you would need?', time: 'Jul 21, 16:30' },
    ],
  },
  {
    id: 'TK-004',
    subject: 'Billing question — upgrade plan',
    description: 'We want to upgrade from the Starter plan to the Growth plan. What is the prorated billing for this month?',
    category: 'billing',
    status: 'RESOLVED',
    priority: 'LOW',
    requester: 'Rahul Verma',
    requesterEmail: 'rahul@metrorealty.com',
    assignedTo: 'Sneha Patel',
    createdAt: 'Jul 20, 10:00',
    updatedAt: 'Jul 20, 15:00',
    comments: [
      { id: 'c1', author: 'Rahul Verma', isAgent: true, text: 'Hi, we want to upgrade to the Growth plan. Can you help with the prorated amount for this billing cycle?', time: 'Jul 20, 10:00' },
      { id: 'c2', author: 'Sneha Patel', isAgent: false, text: 'Hi Rahul! The prorated amount for upgrading from Starter to Growth would be ₹2,400 for the remaining 12 days. I can process this upgrade for you right away.', time: 'Jul 20, 11:30' },
      { id: 'c3', author: 'Rahul Verma', isAgent: true, text: 'That works. Please go ahead with the upgrade.', time: 'Jul 20, 14:00' },
      { id: 'c4', author: 'Sneha Patel', isAgent: false, text: 'Done! Your plan has been upgraded to Growth. You now have access to all premium features. The prorated charge of ₹2,400 has been applied to your next invoice.', time: 'Jul 20, 15:00' },
    ],
  },
  {
    id: 'TK-005',
    subject: 'Cannot log in — invalid credentials error',
    description: 'One of our team members is getting an invalid credentials error despite using the correct password. Tried resetting password but email never arrives.',
    category: 'technical',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    requester: 'Priya Sharma',
    requesterEmail: 'priya@metrorealty.com',
    assignedTo: 'Arjun Kapoor',
    createdAt: 'Jul 22, 08:00',
    updatedAt: '1 hour ago',
    comments: [
      { id: 'c1', author: 'Priya Sharma', isAgent: false, text: 'Team member Karan is unable to log in. He gets invalid credentials even after password reset. The reset email is also not arriving.', time: 'Jul 22, 08:00' },
      { id: 'c2', author: 'Arjun Kapoor', isAgent: true, text: 'I have checked the email logs — it looks like the reset emails are being filtered as spam. I am updating our SPF records. In the meantime, I can manually reset his password.', time: 'Jul 22, 08:30' },
    ],
  },
  {
    id: 'TK-006',
    subject: 'How to set up automated follow-up reminders?',
    description: 'I want to configure automatic reminders for agents when a lead has not been contacted for more than 48 hours.',
    category: 'general',
    status: 'CLOSED',
    priority: 'LOW',
    requester: 'Sneha Patel',
    requesterEmail: 'sneha@metrorealty.com',
    assignedTo: 'Priya Sharma',
    createdAt: 'Jul 18, 13:00',
    updatedAt: 'Jul 19, 10:00',
    comments: [
      { id: 'c1', author: 'Sneha Patel', isAgent: false, text: 'Is there a way to set up automatic follow-up reminders for stale leads?', time: 'Jul 18, 13:00' },
      { id: 'c2', author: 'Priya Sharma', isAgent: false, text: 'Yes! Go to Settings > Automation > Follow-up Rules. You can set the threshold (e.g. 48 hours) and choose how agents are notified (WhatsApp, email, or in-app).', time: 'Jul 18, 14:00' },
      { id: 'c3', author: 'Sneha Patel', isAgent: false, text: 'Perfect, that is exactly what I needed. Thank you!', time: 'Jul 19, 10:00' },
    ],
  },
];
