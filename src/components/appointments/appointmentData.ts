import type { AppointmentStatus } from '@/lib/types';

export type Appointment = {
  id: string;
  title: string;
  leadName: string;
  leadCompany: string;
  date: string; // ISO format YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: 'site_visit' | 'call' | 'demo' | 'meeting';
  status: AppointmentStatus;
  location: string;
  assignedTo: string;
  notes?: string;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().split('T')[0];
const offset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return iso(d);
};

export const APPOINTMENTS: Appointment[] = [
  { id: 'ap1', title: 'Site Visit — Skyline Residency', leadName: 'Rajesh Mehta', leadCompany: 'Metro Realty', date: offset(0), startTime: '10:00', endTime: '11:30', type: 'site_visit', status: 'SCHEDULED', location: 'Skyline Residency, Andheri West', assignedTo: 'Priya Sharma', notes: 'Client interested in 3BHK unit, park-facing' },
  { id: 'ap2', title: 'Follow-up Call', leadName: 'Kavya Reddy', leadCompany: 'Reddy Constructions', date: offset(0), startTime: '16:00', endTime: '16:30', type: 'call', status: 'SCHEDULED', location: 'Phone', assignedTo: 'Arjun Kapoor', notes: 'Discuss pricing options' },
  { id: 'ap3', title: 'Product Demo — CRM Platform', leadName: 'Sunil Group', leadCompany: 'Sunil Enterprises', date: offset(1), startTime: '14:00', endTime: '15:00', type: 'demo', status: 'SCHEDULED', location: 'Zoom', assignedTo: 'Priya Sharma' },
  { id: 'ap4', title: 'Site Visit — Sea View Apartments', leadName: 'Nisha Agarwal', leadCompany: 'Agarwal Estates', date: offset(2), startTime: '11:00', endTime: '12:00', type: 'site_visit', status: 'SCHEDULED', location: 'Sea View Apartments, Bandra', assignedTo: 'Sneha Patel' },
  { id: 'ap5', title: 'Negotiation Meeting', leadName: 'Ananya Builders', leadCompany: 'Ananya Corp', date: offset(3), startTime: '15:30', endTime: '16:30', type: 'meeting', status: 'SCHEDULED', location: 'Office — Conference Room A', assignedTo: 'Arjun Kapoor', notes: 'Final negotiation before closing' },
  { id: 'ap6', title: 'Site Visit — Green Valley', leadName: 'Karthik Solutions', leadCompany: 'Karthik Tech', date: offset(5), startTime: '10:30', endTime: '11:30', type: 'site_visit', status: 'SCHEDULED', location: 'Green Valley, Thane', assignedTo: 'Sneha Patel' },
  { id: 'ap7', title: 'Contract Signing', leadName: 'Metro Realty', leadCompany: 'Metro Group', date: offset(-1), startTime: '13:00', endTime: '14:00', type: 'meeting', status: 'COMPLETED', location: 'Office', assignedTo: 'Sneha Patel' },
  { id: 'ap8', title: 'Discovery Call', leadName: 'Deepika Nair', leadCompany: 'Nair Properties', date: offset(-2), startTime: '15:00', endTime: '15:30', type: 'call', status: 'COMPLETED', location: 'Phone', assignedTo: 'Rahul Verma' },
  { id: 'ap9', title: 'Site Visit — Lakeview Towers', leadName: 'Meera Iyer', leadCompany: 'Iyer Group', date: offset(-3), startTime: '09:00', endTime: '10:00', type: 'site_visit', status: 'NO_SHOW', location: 'Lakeview Towers, Powai', assignedTo: 'Arjun Kapoor' },
  { id: 'ap10', title: 'Demo — Enterprise Plan', leadName: 'Vikram Singh', leadCompany: 'Singh Properties', date: offset(-5), startTime: '14:00', endTime: '15:00', type: 'demo', status: 'CANCELLED', location: 'Zoom', assignedTo: 'Priya Sharma' },
  { id: 'ap11', title: 'Closing Call', leadName: 'Apex Housing', leadCompany: 'Apex Ltd', date: offset(7), startTime: '12:00', endTime: '12:30', type: 'call', status: 'SCHEDULED', location: 'Phone', assignedTo: 'Sneha Patel' },
  { id: 'ap12', title: 'Site Visit — Palm Residency', leadName: 'Rohan Desai', leadCompany: 'Desai Realty', date: offset(7), startTime: '16:00', endTime: '17:00', type: 'site_visit', status: 'SCHEDULED', location: 'Palm Residency, Juhu', assignedTo: 'Rahul Verma' },
];

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
