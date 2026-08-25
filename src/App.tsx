import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TenantEntitlementsProvider } from '@/context/TenantEntitlementsContext';
import { TenantRouteGuard } from '@/components/auth/TenantRouteGuard';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { SessionManager } from '@/components/auth/SessionManager';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { InboxView } from '@/components/inbox/InboxView';
import { ChatRoomView } from '@/components/chatroom/ChatRoomView';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { BroadcastsView } from '@/components/broadcasts/BroadcastsView';
import CreateTemplateView from '@/components/broadcasts/CreateTemplateView';
import CreateBroadcastView from '@/components/broadcasts/CreateBroadcastView';
import { MetaConfigView } from '@/components/meta/MetaConfigView';
import { KnowledgeBaseView } from '@/components/knowledge/KnowledgeBaseView';
import { LiveDemoView } from '@/components/demo/LiveDemoView';

import { LeadDetailView } from '@/components/leaddetail/LeadDetailView';
import { AppointmentsView } from '@/components/appointments/AppointmentsView';
import { BookingView } from '@/components/booking/BookingView';
import { TicketsView } from '@/components/tickets/TicketsView';
import { EmailsView } from '@/components/emails/EmailsView';
import { CreateEmailCampaignView } from '@/components/emails/CreateEmailCampaignView';
import { SettingsView } from '@/components/settings/SettingsView';
import { PropertiesView } from '@/components/properties/PropertiesView';
import { ReportsView } from '@/components/reports/ReportsView';
import { TeamView } from '@/components/team/TeamView';
import { ContactsView } from '@/components/contacts/ContactsView';
import { ContactDetailView } from '@/components/contacts/ContactDetailView';
import { NotFoundView } from '@/components/notfound/NotFoundView';

import { AdminShell } from '@/components/admin/AdminShell';
import { AdminOverview } from '@/components/admin/pages/AdminOverview';
import { AdminTenants } from '@/components/admin/pages/AdminTenants';
import { AdminTenantDetail } from '@/components/admin/pages/AdminTenantDetail';
import { AdminTenantEntitlements } from '@/components/admin/pages/AdminTenantEntitlements';
import { AdminAnalytics } from '@/components/admin/pages/AdminAnalytics';
import { AdminHealth } from '@/components/admin/pages/AdminHealth';
import { AdminAudit } from '@/components/admin/pages/AdminAudit';
import { AdminTickets } from '@/components/admin/pages/AdminTickets';
import { AdminSubscriptions } from '@/components/admin/pages/AdminSubscriptions';
import { AdminUsers } from '@/components/admin/pages/AdminUsers';
import { AdminUserDetail } from '@/components/admin/pages/AdminUserDetail';
import { AdminSearch } from '@/components/admin/pages/AdminSearch';
import { AdminSettings } from '@/components/admin/pages/AdminSettings';
import { AdminTemplates } from '@/components/admin/pages/AdminTemplates';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { CookieConsentBanner } from '@/components/common/CookieConsentBanner';


function ProtectedRoute({
  children,
  adminOnly = false,
  allowPendingOnboarding = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowPendingOnboarding?: boolean;
}) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleUpper = (user?.role || '').toUpperCase();
  const isSuperAdmin =
    user?.isSuperAdmin === true ||
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'PLATFORM_ADMIN' ||
    user?.email?.toLowerCase() === 'gyanvaniai@gmail.com' ||
    user?.email?.toLowerCase().startsWith('superadmin');

  if (adminOnly) {
    if (!isSuperAdmin) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // If user is a regular tenant user and onboarding is pending, redirect to /onboarding
  if (!isSuperAdmin && user.onboardingCompleted === false && !allowPendingOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Ensure floating webchat widget is ONLY displayed on the /demo page
    if (location.pathname !== '/demo') {
      const widgetEl = document.getElementById('crm-chat-widget');
      if (widgetEl) widgetEl.remove();

      document.querySelectorAll('[id*="crm-chat"]').forEach((el) => el.remove());
      document.querySelectorAll('script[data-business-id]').forEach((el) => el.remove());
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthScreen initialMode="login" />} />
        <Route path="/signup" element={<AuthScreen initialMode="signup" />} />

        {/* 5-Step Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowPendingOnboarding>
              {user && !user.isSuperAdmin && user.onboardingCompleted === true ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OnboardingScreen />
              )}
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="tenants/:tenantId" element={<AdminTenantDetail />} />
          <Route path="tenants/:tenantId/entitlements" element={<AdminTenantEntitlements />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="health" element={<AdminHealth />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="search" element={<AdminSearch />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="templates" element={<AdminTemplates />} />
        </Route>

        {/* CRM Routes with Tenant Entitlement & User Permission Guards */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <TenantRouteGuard pageKey="PAGE_DASHBOARD">
                <DashboardView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="demo"
            element={
              <TenantRouteGuard pageKey="PAGE_DASHBOARD">
                <LiveDemoView />
              </TenantRouteGuard>
            }
          />

          <Route
            path="inbox"
            element={
              <TenantRouteGuard pageKey="PAGE_INBOX" userPerm="MODULE_INBOX">
                <InboxView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="chatroom/:contactId?"
            element={
              <TenantRouteGuard pageKey="PAGE_CHATROOM" userPerm="MODULE_INBOX">
                <ChatRoomView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="pipeline"
            element={
              <TenantRouteGuard pageKey="PAGE_PIPELINE" userPerm="MODULE_LEADS">
                <PipelineView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="leaddetail/:leadId?"
            element={
              <TenantRouteGuard pageKey="PAGE_PIPELINE" userPerm="MODULE_LEADS">
                <LeadDetailView />
              </TenantRouteGuard>
            }
          />
          <Route path="broadcasts">
            <Route
              index
              element={
                <TenantRouteGuard pageKey="PAGE_BROADCASTS" userPerm="MODULE_CAMPAIGNS">
                  <BroadcastsView />
                </TenantRouteGuard>
              }
            />
            <Route
              path="create"
              element={
                <TenantRouteGuard pageKey="PAGE_BROADCASTS" userPerm="MODULE_CAMPAIGNS">
                  <CreateBroadcastView />
                </TenantRouteGuard>
              }
            />
            <Route
              path="create-template"
              element={
                <TenantRouteGuard pageKey="PAGE_BROADCASTS" userPerm="MODULE_CAMPAIGNS">
                  <CreateTemplateView />
                </TenantRouteGuard>
              }
            />
          </Route>
          <Route
            path="meta-config"
            element={
              <TenantRouteGuard pageKey="PAGE_META_CONFIG" userPerm="SETTINGS_WHATSAPP">
                <MetaConfigView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="knowledge-base"
            element={
              <TenantRouteGuard pageKey="PAGE_KNOWLEDGE_BASE">
                <KnowledgeBaseView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="appointments"
            element={
              <TenantRouteGuard pageKey="PAGE_APPOINTMENTS">
                <AppointmentsView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="booking"
            element={
              <TenantRouteGuard pageKey="PAGE_BOOKING">
                <BookingView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="tickets"
            element={
              <TenantRouteGuard pageKey="PAGE_TICKETS">
                <TicketsView />
              </TenantRouteGuard>
            }
          />
          <Route path="emails">
            <Route
              index
              element={
                <TenantRouteGuard pageKey="PAGE_EMAILS">
                  <EmailsView />
                </TenantRouteGuard>
              }
            />
            <Route
              path="create"
              element={
                <TenantRouteGuard pageKey="PAGE_EMAILS">
                  <CreateEmailCampaignView />
                </TenantRouteGuard>
              }
            />
          </Route>
          <Route
            path="products"
            element={
              <TenantRouteGuard pageKey="PAGE_PRODUCTS">
                <PropertiesView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="properties"
            element={
              <TenantRouteGuard pageKey="PAGE_PROPERTIES">
                <PropertiesView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="reports"
            element={
              <TenantRouteGuard pageKey="PAGE_REPORTS" userPerm="MODULE_ANALYTICS">
                <ReportsView />
              </TenantRouteGuard>
            }
          />
          <Route
            path="team"
            element={
              <TenantRouteGuard pageKey="PAGE_TEAM" userPerm="MODULE_TEAM">
                <TeamView />
              </TenantRouteGuard>
            }
          />
          <Route path="contacts">
            <Route
              index
              element={
                <TenantRouteGuard pageKey="PAGE_CONTACTS">
                  <ContactsView />
                </TenantRouteGuard>
              }
            />
            <Route
              path=":contactId"
              element={
                <TenantRouteGuard pageKey="PAGE_CONTACTS">
                  <ContactDetailView />
                </TenantRouteGuard>
              }
            />
          </Route>
          <Route
            path="settings/:tab?"
            element={
              <TenantRouteGuard pageKey="SETTINGS_PROFILE" userPerm="MODULE_SETTINGS">
                <SettingsView />
              </TenantRouteGuard>
            }
          />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<NotFoundView />} />
      </Routes>
      <CookieConsentBanner />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantEntitlementsProvider>
          <BrowserRouter>
            <SessionManager />
            <AppContent />
          </BrowserRouter>
        </TenantEntitlementsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
