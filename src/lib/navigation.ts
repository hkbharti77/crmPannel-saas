import {
  LayoutDashboard,
  MessageSquare,
  KanbanSquare,
  Megaphone,
  Plug,
  Brain,
  CalendarDays,
  CalendarCheck,
  Ticket,
  Mail,
  Settings,
  ShoppingBag,
  BarChart3,
  Users,
  Contact,
  type LucideIcon,
} from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'inbox'
  | 'chatroom'
  | 'pipeline'
  | 'broadcasts'
  | 'meta-config'
  | 'knowledge-base'
  | 'leaddetail'
  | 'appointments'
  | 'booking'
  | 'tickets'
  | 'emails'
  | 'products'
  | 'properties'
  | 'reports'
  | 'team'
  | 'contacts'
  | 'settings';

export type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare, badge: 3 },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
  { id: 'meta-config', label: 'Meta Configuration', icon: Plug },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Brain },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'booking', label: 'Booking', icon: CalendarCheck },
  { id: 'tickets', label: 'Tickets', icon: Ticket, badge: 2 },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'products', label: 'Products & Services', icon: ShoppingBag },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'settings', label: 'Settings', icon: Settings },
];
