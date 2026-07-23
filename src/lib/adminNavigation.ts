import {
  LayoutDashboard,
  Building2,
  BarChart3,
  HeartPulse,
  Shield,
  Ticket,
  CreditCard,
  Users,
  Search,
  Settings,
  LayoutTemplate,
  type LucideIcon,
} from 'lucide-react';

export type AdminViewId =
  | 'overview'
  | 'tenants'
  | 'analytics'
  | 'health'
  | 'audit'
  | 'tickets'
  | 'subscriptions'
  | 'users'
  | 'search'
  | 'settings'
  | 'templates';

export const ADMIN_NAV_ITEMS: { id: AdminViewId; label: string; icon: LucideIcon; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Building2, badge: '24' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'audit', label: 'Audit Log', icon: Shield },
  { id: 'tickets', label: 'Tickets', icon: Ticket, badge: '7' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'templates', label: 'Niche Templates', icon: LayoutTemplate },
];

export const ADMIN_TITLES: Record<AdminViewId, string> = {
  overview: 'Platform Overview',
  tenants: 'Tenant Management',
  analytics: 'Platform Analytics',
  health: 'System Health',
  audit: 'Audit Log',
  tickets: 'Support Tickets',
  subscriptions: 'Subscriptions',
  users: 'User Management',
  search: 'Global Search',
  settings: 'Platform Settings',
  templates: 'Niche Templates',
};
