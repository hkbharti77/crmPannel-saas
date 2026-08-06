import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  User, Shield, Globe, CreditCard,
  Paintbrush, Moon, Bell,
  Plug, Mail, LayoutList, ShoppingBag, FormInput, ListTree,
  MessageSquare, MousePointerClick,
  HelpCircle, Zap, LifeBuoy, ChevronRight, SlidersHorizontal, Brain,
  type LucideIcon,
} from 'lucide-react';
import { AccountProfilePanel } from './panels/AccountPanels';
import { SecurityPanel } from './panels/AccountPanels';
import { GoogleCalendarPanel } from './panels/AccountPanels';
import { BillingPanel } from './panels/AccountPanels';
import { CustomBrandingPanel } from './panels/AppearancePanels';
import { DarkModePanel } from './panels/AppearancePanels';
import { NotificationsPanel } from './panels/AppearancePanels';
import { MenuButtonsPanel } from './panels/MenuButtonsPanel';
import { MenuBuilderPanel } from './panels/MenuBuilderPanel';
import { ProductsServicesPanel } from './panels/ProductsServicesPanel';
import { FormFieldsPanel } from './panels/FormFieldsPanel';
import { CustomSubMenusPanel } from './panels/CustomSubMenusPanel';
import { EmailProvidersPanel } from './panels/EmailProvidersPanel';
import { QuickResponsesPanel } from './panels/QuickResponsesPanel';
import { FlowCTAPanel } from './panels/FlowCTAPanel';
import { SupportCategoriesPanel } from './panels/AiSystemPanels';
import { SystemHealthPanel } from './panels/AiSystemPanels';
import { NeedHelpPanel } from './panels/AiSystemPanels';
import { BroadcastFilterConfigPanel } from './panels/BroadcastFilterConfigPanel';
import { EmailBrandingPanel } from './panels/EmailBrandingPanel';

export type SettingsSub =
  | 'account-profile' | 'security' | 'google-calendar' | 'billing'
  | 'branding' | 'dark-mode'
  | 'notifications'
  | 'menu-buttons' | 'menu-builder'
  | 'products' | 'form-fields' | 'custom-submenus' | 'email-templates' | 'email-providers' | 'email-branding'
  | 'quick-responses' | 'flow-cta' | 'broadcast-filter-config'
  | 'support-categories'
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
      { id: 'account-profile', label: 'Account Profile', desc: 'Manage profile details', icon: User },
      { id: 'security', label: 'Security & Privacy', desc: 'Password & authentication', icon: Shield },
      { id: 'google-calendar', label: 'Google Meet Sync', desc: 'Link Google Meetings', icon: Globe },
      { id: 'billing', label: 'Subscription & Billing', desc: 'Limits & plan pricing', icon: CreditCard },
    ],
  },
  {
    section: 'Appearance',
    items: [
      { id: 'branding', label: 'Custom Branding', desc: 'Bot logo and colors', icon: Paintbrush },
      { id: 'dark-mode', label: 'Dark Mode', desc: 'Toggle light and dark', icon: Moon },
    ],
  },
  {
    section: 'Notifications',
    items: [
      { id: 'notifications', label: 'Enable Notifications', desc: 'Alerts & updates', icon: Bell },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { id: 'menu-buttons', label: 'Menu & Buttons', desc: 'Customize UI buttons', icon: LayoutList },
      { id: 'menu-builder', label: 'Menu Builder', desc: 'Main sidebar cards', icon: LayoutList },
      { id: 'products', label: 'Products & Services', desc: 'Manage catalog', icon: ShoppingBag },
      { id: 'form-fields', label: 'Form Fields', desc: 'WhatsApp form fields', icon: FormInput },
      { id: 'custom-submenus', label: 'Custom Sub-Menus', desc: 'Create custom lists', icon: ListTree },
      { id: 'email-providers', label: 'Email Providers', desc: 'AWS SES, SMTP, Brevo', icon: Plug },
      { id: 'email-branding', label: 'Email Branding', desc: 'Logo, colors & footer', icon: Paintbrush },
      { id: 'quick-responses', label: 'Quick Responses', desc: 'Text & image replies', icon: MessageSquare },
      { id: 'flow-cta', label: 'Flow CTA Buttons', desc: 'Cancel & complete buttons', icon: MousePointerClick },
    ],
  },
  {
    section: 'AI & Knowledge',
    items: [
      { id: 'support-categories', label: 'Support Categories', desc: 'Support request tags', icon: HelpCircle },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'system-health', label: 'System Health', desc: 'Backend telemetry', icon: Zap },
    ],
  },
  {
    section: 'Support',
    items: [
      { id: 'need-help', label: 'Need Help?', desc: 'Contact support team', icon: LifeBuoy },
    ],
  },
];

const PANEL_MAP: Record<SettingsSub, () => JSX.Element> = {
  'account-profile': AccountProfilePanel,
  'security': SecurityPanel,
  'google-calendar': GoogleCalendarPanel,
  'billing': BillingPanel,
  'branding': CustomBrandingPanel,
  'dark-mode': DarkModePanel,
  'notifications': NotificationsPanel,
  'menu-buttons': MenuButtonsPanel,
  'menu-builder': MenuBuilderPanel,
  'products': ProductsServicesPanel,
  'form-fields': FormFieldsPanel,
  'custom-submenus': CustomSubMenusPanel,
  'email-templates': () => <Navigate to="/emails?tab=templates" replace />,
  'email-providers': EmailProvidersPanel,
  'email-branding': EmailBrandingPanel,
  'quick-responses': QuickResponsesPanel,
  'flow-cta': FlowCTAPanel,
  'broadcast-filter-config': BroadcastFilterConfigPanel,
  'support-categories': SupportCategoriesPanel,
  'system-health': SystemHealthPanel,
  'need-help': NeedHelpPanel,
};

export function SettingsView() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const active = (tab as SettingsSub) || 'account-profile';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const setActive = (id: SettingsSub) => {
    navigate(`/settings/${id}`);
  };

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<SettingsSub>;
      if (customEvent.detail && PANEL_MAP[customEvent.detail]) {
        setActive(customEvent.detail);
      }
    };
    window.addEventListener('switchSettingsTab', handleSwitchTab);
    return () => window.removeEventListener('switchSettingsTab', handleSwitchTab);
  }, [navigate]);

  if (tab && (!PANEL_MAP[tab as SettingsSub] || !NAV.flatMap((g) => g.items).some((i) => i.id === tab))) {
    return <Navigate to="/settings/account-profile" replace />;
  }

  const Panel = PANEL_MAP[active];
  const activeItem = NAV.flatMap((g) => g.items).find((i) => i.id === active) || NAV[0].items[0];

  return (
    <div className="mx-auto max-w-7xl p-3 lg:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-primary-c">Settings</h2>
        <p className="mt-0.5 text-xs text-secondary-c">Manage your account, integrations, email branding, and workspace configuration.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
        {/* ─── Compact Sidebar nav ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-2.5">
            {NAV.map((group) => (
              <div key={group.section}>
                <p className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-c">
                  {group.section}
                </p>
                <div className="overflow-hidden rounded-xl border border-base-c bg-card-c shadow-sm">
                  {group.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={cx(
                          'flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-all',
                          idx > 0 && 'border-t border-base-c/60',
                          isActive
                            ? 'bg-gradient-accent-soft'
                            : 'hover:bg-slate-50 dark:hover:bg-ink-850',
                        )}
                      >
                        <div className={cx(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                          isActive
                            ? 'bg-primary-500/15 dark:bg-primary-500/20'
                            : 'bg-slate-100 dark:bg-ink-800',
                        )}>
                          <Icon className={cx(
                            'h-3.5 w-3.5',
                            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-c',
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cx(
                            'text-xs font-semibold leading-snug',
                            isActive ? 'text-primary-600 dark:text-primary-300' : 'text-primary-c',
                          )}>
                            {item.label}
                          </p>
                          <p className="truncate text-[10px] text-muted-c leading-tight">{item.desc}</p>
                        </div>
                        {isActive && <ChevronRight className="h-3 w-3 shrink-0 text-primary-500" />}
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
            className="flex w-full items-center gap-2.5 rounded-xl border border-base-c bg-card-c px-3 py-2.5"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-500/15">
              <activeItem.icon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-primary-c">{activeItem.label}</p>
              <p className="text-[10px] text-muted-c">{activeItem.desc}</p>
            </div>
            <ChevronRight className={cx('h-3.5 w-3.5 text-muted-c transition-transform', mobileMenuOpen && 'rotate-90')} />
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 rounded-xl border border-base-c bg-card-c shadow-soft-lg">
              {NAV.map((group) => (
                <div key={group.section}>
                  <p className="px-3 pt-2.5 pb-1 text-[8px] font-bold uppercase tracking-widest text-muted-c">{group.section}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActive(item.id); setMobileMenuOpen(false); }}
                        className={cx(
                          'flex w-full items-center gap-2.5 px-3 py-2 text-left',
                          active === item.id ? 'bg-gradient-accent-soft' : 'hover:bg-slate-50 dark:hover:bg-ink-850',
                        )}
                      >
                        <Icon className={cx('h-3.5 w-3.5 shrink-0', active === item.id ? 'text-primary-500' : 'text-muted-c')} />
                        <span className={cx('text-xs font-medium', active === item.id ? 'text-primary-600 dark:text-primary-300' : 'text-primary-c')}>
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
