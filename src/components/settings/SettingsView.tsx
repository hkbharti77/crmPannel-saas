import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  User, Shield, Globe, CreditCard,
  Paintbrush, Bell,
  Plug, LayoutList, FormInput, ListTree,
  MessageSquare, MousePointerClick,
  HelpCircle, Zap, LifeBuoy, SlidersHorizontal, Smartphone, ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { AccountProfilePanel } from './panels/AccountPanels';
import { SecurityPanel } from './panels/AccountPanels';
import { GoogleCalendarPanel } from './panels/AccountPanels';
import { BillingPanel } from './panels/AccountPanels';
import { CustomBrandingPanel } from './panels/AppearancePanels';
import { NotificationsPanel } from './panels/AppearancePanels';
import { MenuButtonsPanel } from './panels/MenuButtonsPanel';
import { MenuBuilderPanel } from './panels/MenuBuilderPanel';
import { FormFieldsPanel } from './panels/FormFieldsPanel';
import { CustomSubMenusPanel } from './panels/CustomSubMenusPanel';
import { EmailProvidersPanel } from './panels/EmailProvidersPanel';
import { QuickResponsesPanel } from './panels/QuickResponsesPanel';
import { FlowCTAPanel } from './panels/FlowCTAPanel';
import { WhatsAppFlowsPanel } from './panels/WhatsAppFlowsPanel';
import { SupportCategoriesPanel } from './panels/AiSystemPanels';
import { SystemHealthPanel } from './panels/AiSystemPanels';
import { NeedHelpPanel } from './panels/AiSystemPanels';
import { BroadcastFilterConfigPanel } from './panels/BroadcastFilterConfigPanel';
import { NotFoundView } from '@/components/notfound/NotFoundView';

export type SettingsSub =
  | 'account-profile' | 'security' | 'google-calendar' | 'billing'
  | 'branding' | 'dark-mode'
  | 'notifications'
  | 'menu-buttons' | 'menu-builder' | 'whatsapp-flows'
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
      { id: 'branding', label: 'Brand & Identity', desc: 'Logo, theme, widget & emails', icon: Paintbrush },
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
      { id: 'whatsapp-flows', label: 'WhatsApp Flows', desc: 'Native in-app forms', icon: Smartphone },
      { id: 'menu-builder', label: 'Menu Builder', desc: 'Main sidebar cards', icon: LayoutList },
      { id: 'form-fields', label: 'Form Fields', desc: 'WhatsApp form fields', icon: FormInput },
      { id: 'custom-submenus', label: 'Custom Sub-Menus', desc: 'Create custom lists', icon: ListTree },
      { id: 'email-providers', label: 'Email Providers', desc: 'AWS SES, SMTP, Brevo', icon: Plug },
      { id: 'broadcast-filter-config', label: 'Broadcast CSV Filters', desc: 'Audience column filters', icon: SlidersHorizontal },
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
  'branding': () => <CustomBrandingPanel defaultTab="global" />,
  'dark-mode': () => <Navigate to="/settings/branding" replace />,
  'notifications': NotificationsPanel,
  'menu-buttons': MenuButtonsPanel,
  'whatsapp-flows': WhatsAppFlowsPanel,
  'menu-builder': MenuBuilderPanel,
  'products': () => <Navigate to="/products" replace />,
  'form-fields': FormFieldsPanel,
  'custom-submenus': CustomSubMenusPanel,
  'email-templates': () => <Navigate to="/emails?tab=templates" replace />,
  'email-providers': EmailProvidersPanel,
  'email-branding': () => <CustomBrandingPanel defaultTab="email" />,
  'quick-responses': QuickResponsesPanel,
  'flow-cta': FlowCTAPanel,
  'broadcast-filter-config': BroadcastFilterConfigPanel,
  'support-categories': SupportCategoriesPanel,
  'system-health': SystemHealthPanel,
  'need-help': NeedHelpPanel,
};

import { usePermissions } from '@/hooks/usePermissions';
import { useAccess } from '@/context/TenantEntitlementsContext';

export function SettingsView() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { hasSettingsAccess } = useAccess();
  const active = (tab as SettingsSub) || 'account-profile';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const setActive = useCallback((id: SettingsSub) => {
    navigate(`/settings/${id}`);
  }, [navigate]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<SettingsSub>;
      if (customEvent.detail && PANEL_MAP[customEvent.detail]) {
        setActive(customEvent.detail);
      }
    };
    window.addEventListener('switchSettingsTab', handleSwitchTab);
    return () => window.removeEventListener('switchSettingsTab', handleSwitchTab);
  }, [setActive]);

  // Filter NAV items dynamically based on Tenant Entitlements and User RBAC
  const filteredNav: NavGroup[] = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      // 1. Tenant Entitlement check (Super Admin Platform-Level control)
      if (!hasSettingsAccess(item.id)) return false;

      // 2. User RBAC Permission checks
      if (item.id === 'billing' && !hasPermission('SETTINGS_BILLING')) return false;
      if (item.id === 'account-profile' && !hasPermission('SETTINGS_PROFILE')) return false;
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  // 1. If tab parameter was provided but is completely unknown/invalid -> 404 Not Found
  if (tab && !PANEL_MAP[tab as SettingsSub]) {
    return <NotFoundView />;
  }

  // 2. If tab exists in the system but the current user lacks permission -> redirect to first permitted tab
  if (tab && !filteredNav.flatMap((g) => g.items).some((i) => i.id === tab)) {
    const fallbackTab = filteredNav[0]?.items[0]?.id || 'account-profile';
    return <Navigate to={`/settings/${fallbackTab}`} replace />;
  }

  const Panel = PANEL_MAP[active];
  const activeItem = filteredNav.flatMap((g) => g.items).find((i) => i.id === active) || filteredNav[0]?.items[0];

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
            {filteredNav.map((group) => (
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
            <div className="mt-2 rounded-xl border border-base-c bg-card-c shadow-soft-lg max-h-[60vh] overflow-y-auto scrollbar-thin">
              {filteredNav.map((group) => (
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
