/* ─── Types ─── */
export type TenantStatus = 'active' | 'trial' | 'suspended' | 'churned';
export type PlanTier = 'starter' | 'growth' | 'scale' | 'enterprise';

export type Tenant = {
  id: string;
  name: string;
  domain: string;
  plan: PlanTier;
  status: TenantStatus;
  users: number;
  maxUsers: number;
  leads: number;
  mrr: number;
  createdAt: string;
  lastActive: string;
  region: string;
  niche: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  tenant: string;
  role: string;
  status: 'active' | 'suspended' | 'invited';
  lastLogin: string;
  twoFactor: boolean;
};

export type AdminTicket = {
  id: string;
  subject: string;
  tenant: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  requester: string;
  category: string;
};

export type Subscription = {
  id: string;
  tenant: string;
  plan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  mrr: number;
  seats: number;
  seatsUsed: number;
  renewalDate: string;
  paymentMethod: string;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
};

export type ServiceHealth = {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  lastIncident: string;
};

export type NicheTemplate = {
  id: string;
  name: string;
  niche: string;
  description: string;
  stages: string[];
  tenantsUsing: number;
  status: 'published' | 'draft' | 'archived';
  icon: string;
  color: string;
};

/* ─── Plan Meta ─── */
export const PLAN_META: Record<PlanTier, { label: string; color: string; price: number }> = {
  starter: { label: 'Starter', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300', price: 1999 },
  growth: { label: 'Growth', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', price: 4999 },
  scale: { label: 'Scale', color: 'bg-secondary-500/15 text-secondary-700 dark:text-secondary-300', price: 9999 },
  enterprise: { label: 'Enterprise', color: 'bg-gradient-accent text-white', price: 24999 },
};

export const STATUS_META: Record<TenantStatus, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  trial: { label: 'Trial', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  suspended: { label: 'Suspended', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300', dot: 'bg-danger-500' },
  churned: { label: 'Churned', color: 'bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-slate-400', dot: 'bg-slate-400' },
};

/* ─── Mock Data ─── */
export const TENANTS: Tenant[] = [];
export const ADMIN_USERS: AdminUser[] = [];
export const ADMIN_TICKETS: AdminTicket[] = [];
export const SUBSCRIPTIONS: Subscription[] = [];
export const AUDIT_ENTRIES: AuditEntry[] = [];

export const SERVICE_HEALTH: ServiceHealth[] = [
  { name: 'API Gateway', status: 'operational', uptime: 99.98, latency: 42, lastIncident: 'Jul 15, 2026' },
  { name: 'PostgreSQL Database', status: 'operational', uptime: 99.99, latency: 8, lastIncident: 'Jun 28, 2026' },
  { name: 'WhatsApp Edge Function', status: 'operational', uptime: 99.95, latency: 120, lastIncident: 'Jul 20, 2026' },
  { name: 'Auth Service', status: 'operational', uptime: 100, latency: 35, lastIncident: 'Never' },
  { name: 'File Storage', status: 'degraded', uptime: 98.5, latency: 280, lastIncident: '2 hr ago' },
  { name: 'Email Service', status: 'operational', uptime: 99.9, latency: 95, lastIncident: 'Jul 10, 2026' },
  { name: 'Realtime (WebSocket)', status: 'operational', uptime: 99.97, latency: 18, lastIncident: 'Jul 12, 2026' },
  { name: 'CDN', status: 'operational', uptime: 99.99, latency: 12, lastIncident: 'May 3, 2026' },
];

export const NICHE_TEMPLATES: NicheTemplate[] = [
  { id: 'TPL-01', name: 'Residential Broker', niche: 'Residential', description: 'Standard residential sales pipeline with site visit and negotiation stages', stages: ['New Lead', 'Contacted', 'Site Visit', 'Negotiation', 'Booked', 'Won'], tenantsUsing: 8, status: 'published', icon: 'home', color: '#2563EB' },
  { id: 'TPL-02', name: 'Commercial Property', niche: 'Commercial', description: 'B2B commercial leasing and sales with deal size tracking', stages: ['Inquiry', 'Qualification', 'Proposal', 'Site Tour', 'LOI', 'Lease/Sale'], tenantsUsing: 3, status: 'published', icon: 'building', color: '#7C3AED' },
  { id: 'TPL-03', name: 'Luxury Estates', niche: 'Luxury', description: 'High-value property sales with concierge and VIP stages', stages: ['Referral', 'Intro Call', 'Private Viewing', 'Offer', 'Due Diligence', 'Closed'], tenantsUsing: 2, status: 'published', icon: 'crown', color: '#F59E0B' },
  { id: 'TPL-04', name: 'Rental Management', niche: 'Rental', description: 'Rental lead-to-tenant pipeline with verification steps', stages: ['Inquiry', 'Property Match', 'Visit', 'Application', 'Verification', 'Move-in'], tenantsUsing: 4, status: 'published', icon: 'key', color: '#10B981' },
  { id: 'TPL-05', name: 'Land & Plots', niche: 'Land/Plots', description: 'Land acquisition and plot sales with documentation stages', stages: ['Lead', 'Land Inspection', 'Title Check', 'Offer', 'Registration'], tenantsUsing: 1, status: 'published', icon: 'map', color: '#06B6D4' },
  { id: 'TPL-06', name: 'Vacation Rentals', niche: 'Vacation', description: 'Short-term booking pipeline with availability calendar', stages: ['Inquiry', 'Availability', 'Quote', 'Booking', 'Check-in'], tenantsUsing: 2, status: 'published', icon: 'palmtree', color: '#F43F5E' },
  { id: 'TPL-07', name: 'Investment Portfolio', niche: 'Investment', description: 'Investor lead management with ROI calculator integration', stages: ['Investor Lead', 'Profile', 'Property Match', 'ROI Review', 'Commitment', 'Closed'], tenantsUsing: 1, status: 'published', icon: 'trending', color: '#8B5CF6' },
  { id: 'TPL-08', name: 'NRI Services', niche: 'NRI', description: 'Remote property management for non-resident Indian clients', stages: ['NRI Inquiry', 'Requirements', 'Virtual Tour', 'Power of Attorney', 'Booking', 'Handover'], tenantsUsing: 0, status: 'draft', icon: 'globe', color: '#3B82F6' },
];

/* ─── Revenue chart data (monthly MRR) ─── */
export const REVENUE_DATA = [
  { month: 'Jan', mrr: 48997, tenants: 14 },
  { month: 'Feb', mrr: 53996, tenants: 16 },
  { month: 'Mar', mrr: 58995, tenants: 17 },
  { month: 'Apr', mrr: 64994, tenants: 19 },
  { month: 'May', mrr: 71993, tenants: 20 },
  { month: 'Jun', mrr: 78992, tenants: 22 },
  { month: 'Jul', mrr: 85990, tenants: 24 },
];

export const GROWTH_DATA = [
  { week: 'W1', signups: 3, churn: 0 },
  { week: 'W2', signups: 5, churn: 1 },
  { week: 'W3', signups: 2, churn: 0 },
  { week: 'W4', signups: 4, churn: 1 },
  { week: 'W5', signups: 6, churn: 0 },
  { week: 'W6', signups: 3, churn: 2 },
  { week: 'W7', signups: 7, churn: 1 },
  { week: 'W8', signups: 5, churn: 0 },
];
