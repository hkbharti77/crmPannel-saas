import {
  LayoutDashboard,
  MessageSquare,
  KanbanSquare,
  Megaphone,
  CalendarDays,
  CalendarCheck,
  Ticket,
  Mail,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'inbox'
  | 'chatroom'
  | 'pipeline'
  | 'broadcasts'
  | 'leaddetail'
  | 'appointments'
  | 'booking'
  | 'tickets'
  | 'emails'
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
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'booking', label: 'Booking', icon: CalendarCheck },
  { id: 'tickets', label: 'Tickets', icon: Ticket, badge: 2 },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'settings', label: 'Settings', icon: Settings },
];
