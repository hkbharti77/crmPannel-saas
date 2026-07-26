import { useState } from 'react';
import { cx } from '@/lib/types';
import {
  User, Shield, Globe, Users, CreditCard,
  Paintbrush, Moon, Bell,
  Plug, FileText, LayoutList, ShoppingBag, FormInput, ListTree,
  Mail, MessageSquare, MousePointerClick,
  Brain, HelpCircle, Zap, LifeBuoy, ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { AccountProfilePanel } from './panels/AccountPanels';
import { SecurityPanel } from './panels/AccountPanels';
import { GoogleCalendarPanel } from './panels/AccountPanels';
import { StaffManagementPanel } from './panels/AccountPanels';
import { BillingPanel } from './panels/AccountPanels';
import { CustomBrandingPanel } from './panels/AppearancePanels';
import { DarkModePanel } from './panels/AppearancePanels';
import { NotificationsPanel } from './panels/AppearancePanels';
import { MetaIntegrationPanel } from './panels/ConfigPanels';
import { WhatsAppTemplatesPanel } from './panels/ConfigPanels';
import { MenuButtonsPanel } from './panels/ConfigPanels';
import { MenuBuilderPanel } from './panels/ConfigPanels';
import { ProductsServicesPanel } from './panels/ConfigPanels';
import { FormFieldsPanel } from './panels/ConfigPanels';
import { CustomSubMenusPanel } from './panels/ConfigPanels';
import { EmailTemplatesPanel } from './panels/ConfigPanels';
import { QuickResponsesPanel } from './panels/ConfigPanels';
import { FlowCTAPanel } from './panels/ConfigPanels';
import { KnowledgeBasePanel } from './panels/AiSystemPanels';
import { SupportCategoriesPanel } from './panels/AiSystemPanels';
import { SystemHealthPanel } from './panels/AiSystemPanels';
import { NeedHelpPanel } from './panels/AiSystemPanels';

export type SettingsSub =
  | 'account-profile' | 'security' | 'google-calendar' | 'staff' | 'billing'
  | 'branding' | 'dark-mode'
  | 'notifications'
  | 'meta-integration' | 'wa-templates' | 'menu-buttons' | 'menu-builder'
  | 'products' | 'form-fields' | 'custom-submenus' | 'email-templates'
  | 'quick-responses' | 'flow-cta'
  | 'knowledge-base' | 'support-categories'
  | 'system-health'
  | 'need-help';

type NavItem = {
  id: SettingsSub;
  label: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    section: 'Account',
    items: [
      { id: 'account-profile', label: 'Account Profile', desc: 'Manage your account details', icon: User },
      { id: 'security', label: 'Security & Privacy', desc: 'Password and authentication', icon: Shield },
      { id: 'google-calendar', label: 'Google Calendar & Meet', desc: 'Link Google account for online meetings', icon: Globe },
      { id: 'staff', label: 'Staff Management', desc: 'Invite and manage employees', icon: Users },
      { id: 'billing', label: 'Subscription & Billing', desc: 'Manage limits and pricing plans', icon: CreditCard },
    ],
  },
  {
    section: 'Appearance',
    items: [
      { id: 'branding', label: 'Custom Branding', desc: 'Bot logo and colors', icon: Paintbrush },
      { id: 'dark-mode', label: 'Dark Mode', desc: 'Toggle light and dark theme', icon: Moon },
    ],
  },
  {
    section: 'Notifications',
    items: [
      { id: 'notifications', label: 'Enable Notifications', desc: 'Stay updated with messages', icon: Bell },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { id: 'meta-integration', label: 'Meta Integration', desc: 'WhatsApp API credentials & Dual Connection Modes', icon: Plug },
      { id: 'wa-templates', label: 'WhatsApp Template Builder', desc: 'Create HSM message templates & sync Meta directory', icon: FileText },
      { id: 'menu-buttons', label: 'Menu & Buttons', desc: 'Customize UI buttons', icon: LayoutList },
      { id: 'menu-builder', label: 'Menu Builder', desc: 'Customize the main sidebar cards', icon: LayoutList },
      { id: 'products', label: 'Products & Services', desc: 'Manage your catalog', icon: ShoppingBag },
      { id: 'form-fields', label: 'Form Fields', desc: 'Customize WhatsApp form fields', icon: FormInput },
      { id: 'custom-submenus', label: 'Custom Sub-Menus', desc: 'Create custom lists', icon: ListTree },
      { id: 'email-templates', label: 'Email Templates', desc: 'Automated lead follow-ups', icon: Mail },
      { id: 'quick-responses', label: 'Quick Responses', desc: 'Direct text & image replies', icon: MessageSquare },
      { id: 'flow-cta', label: 'Flow CTA Buttons', desc: 'Buttons for cancel & complete', icon: MousePointerClick },
    ],
  },
  {
    section: 'AI & Knowledge',
    items: [
      { id: 'knowledge-base', label: 'Knowledge Base', desc: 'Train your RAG bot', icon: Brain },
      { id: 'support-categories', label: 'Support Categories', desc: 'WhatsApp support requests', icon: HelpCircle },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'system-health', label: 'System Health', desc: 'Backend telemetry & status', icon: Zap },
    ],
  },
  {
    section: 'Support & Help',
    items: [
      { id: 'need-help', label: 'Need Help?', desc: 'Contact our support team for assistance', icon: LifeBuoy },
    ],
  },
];

const PANEL_MAP: Record<SettingsSub, () => JSX.Element> = {
  'account-profile': AccountProfilePanel,
  'security': SecurityPanel,
  'google-calendar': GoogleCalendarPanel,
  'staff': StaffManagementPanel,
  'billing': BillingPanel,
  'branding': CustomBrandingPanel,
  'dark-mode': DarkModePanel,
  'notifications': NotificationsPanel,
  'meta-integration': MetaIntegrationPanel,
  'wa-templates': WhatsAppTemplatesPanel,
  'menu-buttons': MenuButtonsPanel,
  'menu-builder': MenuBuilderPanel,
  'products': ProductsServicesPanel,
  'form-fields': FormFieldsPanel,
  'custom-submenus': CustomSubMenusPanel,
  'email-templates': EmailTemplatesPanel,
  'quick-responses': QuickResponsesPanel,
  'flow-cta': FlowCTAPanel,
  'knowledge-base': KnowledgeBasePanel,
  'support-categories': SupportCategoriesPanel,
  'system-health': SystemHealthPanel,
  'need-help': NeedHelpPanel,
};

export function SettingsView() {
  const [active, setActive] = useState<SettingsSub>('account-profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Panel = PANEL_MAP[active];
  const activeItem = NAV.flatMap((g) => g.items).find((i) => i.id === active)!;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Settings</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Manage your account, integrations, and workspace configuration.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* ─── Sidebar nav ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            {NAV.map((group) => (
              <div key={group.section}>
                <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-c">
                  {group.section}
                </p>
                <div className="overflow-hidden rounded-xl2 border border-base-c bg-card-c">
                  {group.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={cx(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-all',
                          idx > 0 && 'border-t border-base-c',
                          isActive
                            ? 'bg-gradient-accent-soft'
                            : 'hover:bg-slate-50 dark:hover:bg-ink-850',
                        )}
                      >
                        <div className={cx(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                          isActive
                            ? 'bg-primary-500/15 dark:bg-primary-500/20'
                            : 'bg-slate-100 dark:bg-ink-800',
                        )}>
                          <Icon className={cx(
                            'h-4 w-4',
                            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-c',
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cx(
                            'text-sm font-semibold',
                            isActive ? 'text-primary-600 dark:text-primary-300' : 'text-primary-c',
                          )}>
                            {item.label}
                          </p>
                          <p className="truncate text-[11px] text-muted-c">{item.desc}</p>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── Mobile nav picker ─── */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex w-full items-center gap-3 rounded-xl2 border border-base-c bg-card-c px-4 py-3"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500/15">
              <activeItem.icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-primary-c">{activeItem.label}</p>
              <p className="text-[11px] text-muted-c">{activeItem.desc}</p>
            </div>
            <ChevronRight className={cx('h-4 w-4 text-muted-c transition-transform', mobileMenuOpen && 'rotate-90')} />
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 rounded-xl2 border border-base-c bg-card-c shadow-soft-lg">
              {NAV.map((group) => (
                <div key={group.section}>
                  <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-c">{group.section}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActive(item.id); setMobileMenuOpen(false); }}
                        className={cx(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left',
                          active === item.id ? 'bg-gradient-accent-soft' : 'hover:bg-slate-50 dark:hover:bg-ink-850',
                        )}
                      >
                        <Icon className={cx('h-4 w-4 shrink-0', active === item.id ? 'text-primary-500' : 'text-muted-c')} />
                        <span className={cx('text-sm font-medium', active === item.id ? 'text-primary-600 dark:text-primary-300' : 'text-primary-c')}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Panel content ─── */}
        <div className="min-w-0">
          <Panel />
        </div>
      </div>
    </div>
  );
}
