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
export const TENANTS: Tenant[] = [
  { id: 'T-001', name: 'Metro Realty', domain: 'metro.crlite.io', plan: 'growth', status: 'active', users: 5, maxUsers: 10, leads: 291, mrr: 4999, createdAt: 'Jan 2025', lastActive: '2 min ago', region: 'Mumbai', niche: 'Residential' },
  { id: 'T-002', name: 'Prime Commercial', domain: 'prime.crlite.io', plan: 'scale', status: 'active', users: 12, maxUsers: 25, leads: 845, mrr: 9999, createdAt: 'Mar 2025', lastActive: '15 min ago', region: 'Delhi', niche: 'Commercial' },
  { id: 'T-003', name: 'Luxe Estates', domain: 'luxe.crlite.io', plan: 'enterprise', status: 'active', users: 28, maxUsers: 50, leads: 1240, mrr: 24999, createdAt: 'Nov 2024', lastActive: '1 hr ago', region: 'Bangalore', niche: 'Luxury' },
  { id: 'T-004', name: 'Suburb Homes', domain: 'suburb.crlite.io', plan: 'starter', status: 'trial', users: 2, maxUsers: 5, leads: 34, mrr: 0, createdAt: 'Jul 2026', lastActive: '3 hr ago', region: 'Pune', niche: 'Residential' },
  { id: 'T-005', name: 'Skyline Properties', domain: 'skyline.crlite.io', plan: 'growth', status: 'active', users: 8, maxUsers: 10, leads: 412, mrr: 4999, createdAt: 'Feb 2025', lastActive: '5 hr ago', region: 'Mumbai', niche: 'Residential' },
  { id: 'T-006', name: 'Greenfield Land Co', domain: 'greenfield.crlite.io', plan: 'starter', status: 'active', users: 3, maxUsers: 5, leads: 87, mrr: 1999, createdAt: 'May 2025', lastActive: '1 day ago', region: 'Chennai', niche: 'Land/Plots' },
  { id: 'T-007', name: 'Urban Nest', domain: 'urban.crlite.io', plan: 'growth', status: 'suspended', users: 6, maxUsers: 10, leads: 198, mrr: 0, createdAt: 'Apr 2025', lastActive: '5 days ago', region: 'Hyderabad', niche: 'Residential' },
  { id: 'T-008', name: 'Elite Rentals', domain: 'elite.crlite.io', plan: 'scale', status: 'active', users: 15, maxUsers: 25, leads: 623, mrr: 9999, createdAt: 'Dec 2024', lastActive: '20 min ago', region: 'Delhi', niche: 'Rental' },
  { id: 'T-009', name: 'Coastal Realty', domain: 'coastal.crlite.io', plan: 'growth', status: 'active', users: 7, maxUsers: 10, leads: 356, mrr: 4999, createdAt: 'Jun 2025', lastActive: '2 hr ago', region: 'Goa', niche: 'Vacation' },
  { id: 'T-010', name: 'Apex Investors', domain: 'apex.crlite.io', plan: 'enterprise', status: 'active', users: 35, maxUsers: 50, leads: 2100, mrr: 24999, createdAt: 'Oct 2024', lastActive: '8 min ago', region: 'Mumbai', niche: 'Investment' },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: 'U-001', name: 'Arjun Kapoor', email: 'arjun@metrorealty.com', tenant: 'Metro Realty', role: 'Tenant Admin', status: 'active', lastLogin: '2 min ago', twoFactor: true },
  { id: 'U-002', name: 'Priya Sharma', email: 'priya@metrorealty.com', tenant: 'Metro Realty', role: 'Sales Agent', status: 'active', lastLogin: '1 hr ago', twoFactor: false },
  { id: 'U-003', name: 'Rajesh Kumar', email: 'rajesh@prime.com', tenant: 'Prime Commercial', role: 'Tenant Admin', status: 'active', lastLogin: '15 min ago', twoFactor: true },
  { id: 'U-004', name: 'Sneha Patel', email: 'sneha@metrorealty.com', tenant: 'Metro Realty', role: 'Property Advisor', status: 'active', lastLogin: '3 hr ago', twoFactor: false },
  { id: 'U-005', name: 'Vikram Singh', email: 'vikram@luxe.in', tenant: 'Luxe Estates', role: 'Tenant Admin', status: 'active', lastLogin: '1 hr ago', twoFactor: true },
  { id: 'U-006', name: 'Anita Rao', email: 'anita@urban.co', tenant: 'Urban Nest', role: 'Manager', status: 'suspended', lastLogin: '5 days ago', twoFactor: false },
  { id: 'U-007', name: 'Karan Mehta', email: 'karan@elite.co', tenant: 'Elite Rentals', role: 'Sales Agent', status: 'active', lastLogin: '20 min ago', twoFactor: true },
  { id: 'U-008', name: 'Deepak Joshi', email: 'deepak@apex.io', tenant: 'Apex Investors', role: 'Tenant Admin', status: 'active', lastLogin: '8 min ago', twoFactor: true },
  { id: 'U-009', name: 'Meera Nair', email: 'meera@coastal.go', tenant: 'Coastal Realty', role: 'Sales Agent', status: 'invited', lastLogin: 'Never', twoFactor: false },
  { id: 'U-010', name: 'Sanjay Gupta', email: 'sanjay@greenfield.in', tenant: 'Greenfield Land Co', role: 'Tenant Admin', status: 'active', lastLogin: '1 day ago', twoFactor: false },
];

export const ADMIN_TICKETS: AdminTicket[] = [
  { id: 'TK-301', subject: 'WhatsApp integration not sending messages', tenant: 'Metro Realty', priority: 'URGENT', status: 'OPEN', createdAt: '2 hr ago', requester: 'Arjun Kapoor', category: 'Integration' },
  { id: 'TK-302', subject: 'Need additional seats on Growth plan', tenant: 'Skyline Properties', priority: 'MEDIUM', status: 'OPEN', createdAt: '5 hr ago', requester: 'Neha Reddy', category: 'Billing' },
  { id: 'TK-303', subject: 'Pipeline board not loading on Safari', tenant: 'Prime Commercial', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: '8 hr ago', requester: 'Rajesh Kumar', category: 'Bug' },
  { id: 'TK-304', subject: 'Custom field for property type', tenant: 'Luxe Estates', priority: 'LOW', status: 'OPEN', createdAt: '1 day ago', requester: 'Vikram Singh', category: 'Feature' },
  { id: 'TK-305', subject: 'Cannot export lead data to CSV', tenant: 'Apex Investors', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: '1 day ago', requester: 'Deepak Joshi', category: 'Bug' },
  { id: 'TK-306', subject: 'Upgrade from Starter to Growth', tenant: 'Greenfield Land Co', priority: 'MEDIUM', status: 'OPEN', createdAt: '2 days ago', requester: 'Sanjay Gupta', category: 'Billing' },
  { id: 'TK-307', subject: 'Two-factor auth setup help', tenant: 'Elite Rentals', priority: 'LOW', status: 'RESOLVED', createdAt: '3 days ago', requester: 'Karan Mehta', category: 'Support' },
];

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 'SUB-001', tenant: 'Metro Realty', plan: 'growth', status: 'active', mrr: 4999, seats: 10, seatsUsed: 5, renewalDate: 'Aug 22, 2026', paymentMethod: '•••• 4242' },
  { id: 'SUB-002', tenant: 'Prime Commercial', plan: 'scale', status: 'active', mrr: 9999, seats: 25, seatsUsed: 12, renewalDate: 'Sep 15, 2026', paymentMethod: '•••• 1881' },
  { id: 'SUB-003', tenant: 'Luxe Estates', plan: 'enterprise', status: 'active', mrr: 24999, seats: 50, seatsUsed: 28, renewalDate: 'Dec 1, 2026', paymentMethod: '•••• 5567' },
  { id: 'SUB-004', tenant: 'Suburb Homes', plan: 'starter', status: 'trialing', mrr: 0, seats: 5, seatsUsed: 2, renewalDate: 'Trial ends Aug 5', paymentMethod: 'None' },
  { id: 'SUB-005', tenant: 'Skyline Properties', plan: 'growth', status: 'active', mrr: 4999, seats: 10, seatsUsed: 8, renewalDate: 'Aug 10, 2026', paymentMethod: '•••• 7733' },
  { id: 'SUB-006', tenant: 'Greenfield Land Co', plan: 'starter', status: 'active', mrr: 1999, seats: 5, seatsUsed: 3, renewalDate: 'Oct 3, 2026', paymentMethod: '•••• 9982' },
  { id: 'SUB-007', tenant: 'Urban Nest', plan: 'growth', status: 'past_due', mrr: 4999, seats: 10, seatsUsed: 6, renewalDate: 'Overdue 5 days', paymentMethod: '•••• 2255' },
  { id: 'SUB-008', tenant: 'Elite Rentals', plan: 'scale', status: 'active', mrr: 9999, seats: 25, seatsUsed: 15, renewalDate: 'Nov 20, 2026', paymentMethod: '•••• 6644' },
  { id: 'SUB-009', tenant: 'Coastal Realty', plan: 'growth', status: 'active', mrr: 4999, seats: 10, seatsUsed: 7, renewalDate: 'Sep 28, 2026', paymentMethod: '•••• 3399' },
  { id: 'SUB-010', tenant: 'Apex Investors', plan: 'enterprise', status: 'active', mrr: 24999, seats: 50, seatsUsed: 35, renewalDate: 'Jan 15, 2027', paymentMethod: '•••• 1100' },
];

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'AU-001', actor: 'admin@crmlite.io', action: 'Suspended tenant', target: 'Urban Nest (T-007)', timestamp: 'Jul 23, 2026 2:15 PM', ip: '103.21.45.10', severity: 'critical' },
  { id: 'AU-002', actor: 'admin@crmlite.io', action: 'Upgraded plan', target: 'Skyline Properties → Growth', timestamp: 'Jul 23, 2026 11:30 AM', ip: '103.21.45.10', severity: 'info' },
  { id: 'AU-003', actor: 'support@crmlite.io', action: 'Resolved ticket', target: 'TK-307', timestamp: 'Jul 23, 2026 9:45 AM', ip: '103.21.45.12', severity: 'info' },
  { id: 'AU-004', actor: 'admin@crmlite.io', action: 'Reset user password', target: 'anita@urban.co', timestamp: 'Jul 22, 2026 4:20 PM', ip: '103.21.45.10', severity: 'warning' },
  { id: 'AU-005', actor: 'system', action: 'Auto-suspended tenant', target: 'Urban Nest (past due 5 days)', timestamp: 'Jul 22, 2026 12:00 AM', ip: 'system', severity: 'critical' },
  { id: 'AU-006', actor: 'admin@crmlite.io', action: 'Added seats', target: 'Apex Investors +15 seats', timestamp: 'Jul 21, 2026 3:10 PM', ip: '103.21.45.10', severity: 'info' },
  { id: 'AU-007', actor: 'admin@crmlite.io', action: 'Published template', target: 'Luxury Villa Template', timestamp: 'Jul 20, 2026 10:00 AM', ip: '103.21.45.10', severity: 'info' },
  { id: 'AU-008', actor: 'support@crmlite.io', action: 'Created tenant', target: 'Suburb Homes (T-004)', timestamp: 'Jul 18, 2026 2:00 PM', ip: '103.21.45.12', severity: 'info' },
  { id: 'AU-009', actor: 'admin@crmlite.io', action: 'Updated billing', target: 'Prime Commercial payment method', timestamp: 'Jul 17, 2026 5:30 PM', ip: '103.21.45.10', severity: 'warning' },
  { id: 'AU-010', actor: 'system', action: 'Trial started', target: 'Suburb Homes (14-day trial)', timestamp: 'Jul 18, 2026 2:00 PM', ip: 'system', severity: 'info' },
];

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
