import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyTenantEntitlements, type TenantEffectiveEntitlements } from '@/lib/tenantEntitlementsApi';

interface TenantEntitlementsContextType {
  entitlements: TenantEffectiveEntitlements | null;
  loading: boolean;
  version: number;
  refreshEntitlements: () => Promise<void>;
  hasPageAccess: (pageKey: string) => boolean;
  hasSettingsAccess: (settingKey: string) => boolean;
  hasService: (serviceKey: string) => boolean;
  canAccess: (
    pageOrSettingKey: string,
    requiredUserPerm?: string
  ) => { allowed: boolean; reason?: 'FEATURE_LOCKED' | 'PERMISSION_DENIED' | 'TENANT_INACTIVE' };
}

const TenantEntitlementsContext = createContext<TenantEntitlementsContextType>({
  entitlements: null,
  loading: true,
  version: 1,
  refreshEntitlements: async () => {},
  hasPageAccess: () => true,
  hasSettingsAccess: () => true,
  hasService: () => true,
  canAccess: () => ({ allowed: true }),
});

// Mapping from route/sidebar ID to standard PAGE key
const ROUTE_PAGE_MAP: Record<string, string> = {
  dashboard: 'PAGE_DASHBOARD',
  inbox: 'PAGE_INBOX',
  chatroom: 'PAGE_CHATROOM',
  pipeline: 'PAGE_PIPELINE',
  broadcasts: 'PAGE_BROADCASTS',
  'meta-config': 'PAGE_META_CONFIG',
  'knowledge-base': 'PAGE_KNOWLEDGE_BASE',
  appointments: 'PAGE_APPOINTMENTS',
  booking: 'PAGE_BOOKING',
  tickets: 'PAGE_TICKETS',
  emails: 'PAGE_EMAILS',
  products: 'PAGE_PRODUCTS',
  properties: 'PAGE_PROPERTIES',
  reports: 'PAGE_REPORTS',
  team: 'PAGE_TEAM',
  contacts: 'PAGE_CONTACTS',
  settings: 'SETTINGS_PROFILE',
};

// Mapping from settings sub-tab to standard SETTINGS key
const SETTINGS_TAB_MAP: Record<string, string> = {
  'account-profile': 'SETTINGS_PROFILE',
  security: 'SETTINGS_SECURITY',
  'google-calendar': 'SETTINGS_CALENDAR',
  billing: 'SETTINGS_BILLING',
  branding: 'SETTINGS_BRANDING',
  'dark-mode': 'SETTINGS_PROFILE',
  notifications: 'SETTINGS_NOTIFICATIONS',
  'menu-buttons': 'SETTINGS_MENU_BUTTONS',
  'whatsapp-flows': 'SETTINGS_WHATSAPP_FLOWS',
  'menu-builder': 'SETTINGS_MENU_BUILDER',
  products: 'SETTINGS_PRODUCTS',
  'form-fields': 'SETTINGS_FORM_FIELDS',
  'custom-submenus': 'SETTINGS_SUBMENUS',
  'email-providers': 'SETTINGS_EMAIL_PROVIDERS',
  'broadcast-filter-config': 'SETTINGS_BROADCAST_FILTERS',
  'quick-responses': 'SETTINGS_QUICK_RESPONSES',
  'flow-cta': 'SETTINGS_FLOW_CTA',
  'support-categories': 'SETTINGS_SUPPORT_CATEGORIES',
  'system-health': 'SETTINGS_SYSTEM_HEALTH',
  'need-help': 'SETTINGS_HELP',
};

export const TenantEntitlementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<TenantEffectiveEntitlements | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadEntitlements = useCallback(async () => {
    if (!user) {
      setEntitlements(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetchMyTenantEntitlements();
      if (res.data) {
        setEntitlements(res.data);
      }
    } catch (err) {
      console.warn('⚠️ Could not load tenant entitlements:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEntitlements();

    // Listen for custom global event to refresh entitlements
    const handleRefresh = () => loadEntitlements();
    window.addEventListener('entitlementsUpdated', handleRefresh);
    return () => window.removeEventListener('entitlementsUpdated', handleRefresh);
  }, [loadEntitlements]);

  const isSuperAdmin =
    user?.isSuperAdmin === true ||
    (user?.role || '').toUpperCase() === 'SUPER_ADMIN' ||
    (user?.role || '').toUpperCase() === 'PLATFORM_ADMIN';

  const hasPageAccess = useCallback(
    (pageKeyOrRouteId: string): boolean => {
      if (isSuperAdmin) return true;
      if (!entitlements) return true; // optimistic default while loading

      const normalizedKey = pageKeyOrRouteId.startsWith('PAGE_')
        ? pageKeyOrRouteId
        : ROUTE_PAGE_MAP[pageKeyOrRouteId] || pageKeyOrRouteId;

      if (normalizedKey === 'PAGE_DASHBOARD') return true;
      if (entitlements.pages && normalizedKey in entitlements.pages) {
        return Boolean(entitlements.pages[normalizedKey]);
      }
      return true;
    },
    [entitlements, isSuperAdmin]
  );

  const hasSettingsAccess = useCallback(
    (settingKeyOrTabId: string): boolean => {
      if (isSuperAdmin) return true;
      if (!entitlements) return true;

      const normalizedKey = settingKeyOrTabId.startsWith('SETTINGS_')
        ? settingKeyOrTabId
        : SETTINGS_TAB_MAP[settingKeyOrTabId] || settingKeyOrTabId;

      if (
        normalizedKey === 'SETTINGS_PROFILE' ||
        normalizedKey === 'SETTINGS_SECURITY' ||
        normalizedKey === 'SETTINGS_BILLING' ||
        normalizedKey === 'SETTINGS_HELP'
      ) {
        return true;
      }

      if (entitlements.settings && normalizedKey in entitlements.settings) {
        return Boolean(entitlements.settings[normalizedKey]);
      }
      return true;
    },
    [entitlements, isSuperAdmin]
  );

  const hasService = useCallback(
    (serviceKey: string): boolean => {
      if (isSuperAdmin) return true;
      if (!entitlements || !entitlements.services) return true;
      return Boolean(entitlements.services[serviceKey]);
    },
    [entitlements, isSuperAdmin]
  );

  const canAccess = useCallback(
    (
      pageOrSettingKey: string,
      requiredUserPerm?: string
    ): { allowed: boolean; reason?: 'FEATURE_LOCKED' | 'PERMISSION_DENIED' | 'TENANT_INACTIVE' } => {
      if (isSuperAdmin) return { allowed: true };

      // 1. Check Tenant Entitlement
      const isPage = pageOrSettingKey.startsWith('PAGE_') || pageOrSettingKey in ROUTE_PAGE_MAP;
      const tenantEntitled = isPage ? hasPageAccess(pageOrSettingKey) : hasSettingsAccess(pageOrSettingKey);

      if (!tenantEntitled) {
        return { allowed: false, reason: 'FEATURE_LOCKED' };
      }

      // 2. Check User RBAC Permission
      if (requiredUserPerm) {
        const userPerms = user?.permissions || [];
        const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
        const hasUserPerm = isOwnerOrAdmin || userPerms.includes('*') || userPerms.includes(requiredUserPerm);

        if (!hasUserPerm) {
          return { allowed: false, reason: 'PERMISSION_DENIED' };
        }
      }

      return { allowed: true };
    },
    [hasPageAccess, hasSettingsAccess, isSuperAdmin, user]
  );

  return (
    <TenantEntitlementsContext.Provider
      value={{
        entitlements,
        loading,
        version: entitlements?.entitlementVersion || 1,
        refreshEntitlements: loadEntitlements,
        hasPageAccess,
        hasSettingsAccess,
        hasService,
        canAccess,
      }}
    >
      {children}
    </TenantEntitlementsContext.Provider>
  );
};

export function useAccess() {
  return useContext(TenantEntitlementsContext);
}
