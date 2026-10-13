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
  Send,
  Settings,
  ShoppingBag,
  BarChart3,
  Users,
  Contact,
  CreditCard,
  Store,
  Workflow,
  Bot,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

export type ViewId =
  | 'dashboard'
  | 'demo'
  | 'inbox'
  | 'calls'
  | 'chatroom'
  | 'pipeline'
  | 'broadcasts'
  | 'journeys'
  | 'meta-config'
  | 'knowledge-base'
  | 'leaddetail'
  | 'appointments'
  | 'booking'
  | 'tickets'
  | 'emails'
  | 'sms'
  | 'payments'
  | 'products'
  | 'properties'
  | 'reports'
  | 'team'
  | 'contacts'
  | 'catalogs'
  | 'settings';

export type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: number;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'demo', label: 'Widget', icon: Bot },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare, badge: 3 },
  { id: 'calls', label: 'Voice AI', icon: PhoneCall },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
  { id: 'journeys', label: 'Automations', icon: Workflow },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'meta-config', label: 'Meta', icon: Plug },
  { id: 'knowledge-base', label: 'Knowledge', icon: Brain },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'booking', label: 'Booking', icon: CalendarCheck },
  { id: 'tickets', label: 'Tickets', icon: Ticket, badge: 2 },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Send },
  { id: 'products', label: 'Services', icon: ShoppingBag },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'catalogs', label: 'Catalogs', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
];
