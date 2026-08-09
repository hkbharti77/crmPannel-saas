import type { AppointmentStatus } from '@/lib/types';

export type Appointment = {
  id: string;
  title: string;
  contactName?: string;
  contactWaId?: string;
  company?: string;
  leadName?: string;
  leadCompany?: string;
  date: string; // ISO format YYYY-MM-DD
  time?: string;
  startTime?: string;
  endTime?: string;
  type: 'site_visit' | 'call' | 'demo' | 'meeting';
  status: AppointmentStatus;
  location: string;
  assignedTo: string;
  notes?: string;
  collectedData?: Record<string, unknown>;
};

export const APPOINTMENTS: Appointment[] = [];

export const TYPE_CONFIG: { type: Appointment['type']; label: string; color: string; bg: string; dot: string }[] = [
  { type: 'site_visit', label: 'Site Visit', color: 'text-success-700 dark:text-success-300', bg: 'bg-success-500/12', dot: 'bg-success-500' },
  { type: 'call', label: 'Call', color: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary-500/12', dot: 'bg-primary-500' },
  { type: 'demo', label: 'Demo', color: 'text-secondary-700 dark:text-secondary-300', bg: 'bg-secondary-500/12', dot: 'bg-secondary-500' },
  { type: 'meeting', label: 'Meeting', color: 'text-warning-700 dark:text-warning-300', bg: 'bg-warning-500/12', dot: 'bg-warning-500' },
];

export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  COMPLETED: { label: 'Completed', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
  NO_SHOW: { label: 'No Show', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
};

export const TYPE_ICONS: Record<Appointment['type'], string> = {
  site_visit: 'MapPin',
  call: 'Phone',
  demo: 'MonitorPlay',
  meeting: 'Users',
};
