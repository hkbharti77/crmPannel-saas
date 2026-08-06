import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AdminAnalytics } from '@/components/admin/pages/AdminAnalytics';
import { AdminHealth } from '@/components/admin/pages/AdminHealth';
import { AdminAudit } from '@/components/admin/pages/AdminAudit';
import { AdminTickets } from '@/components/admin/pages/AdminTickets';
import { AdminSubscriptions } from '@/components/admin/pages/AdminSubscriptions';
import { AdminUsers } from '@/components/admin/pages/AdminUsers';
import { AdminSearch } from '@/components/admin/pages/AdminSearch';
import { AdminSettings } from '@/components/admin/pages/AdminSettings';
import { AdminTemplates } from '@/components/admin/pages/AdminTemplates';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
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

  if (adminOnly) {
    const roleUpper = (user?.role || '').toUpperCase();
    const isSuperAdmin =
      user?.isSuperAdmin === true ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN' ||
      user?.email?.toLowerCase() === 'gyanvaniai@gmail.com' ||
      user?.email?.toLowerCase().startsWith('superadmin');
      
    if (!isSuperAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<AuthScreen initialMode="login" />} />
      <Route path="/signup" element={<AuthScreen initialMode="signup" />} />
      
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
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="health" element={<AdminHealth />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="search" element={<AdminSearch />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="templates" element={<AdminTemplates />} />
      </Route>

      {/* CRM Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="inbox" element={<InboxView />} />
        <Route path="chatroom/:contactId?" element={<ChatRoomView />} />
        <Route path="pipeline" element={<PipelineView />} />
        <Route path="leaddetail/:leadId?" element={<LeadDetailView />} />
        <Route path="broadcasts">
          <Route index element={<BroadcastsView />} />
          <Route path="create" element={<CreateBroadcastView />} />
          <Route path="create-template" element={<CreateTemplateView />} />
        </Route>
        <Route path="meta-config" element={<MetaConfigView />} />
        <Route path="knowledge-base" element={<KnowledgeBaseView />} />
        <Route path="appointments" element={<AppointmentsView />} />
        <Route path="booking" element={<BookingView />} />
        <Route path="tickets" element={<TicketsView />} />
        <Route path="emails">
          <Route index element={<EmailsView />} />
          <Route path="create" element={<CreateEmailCampaignView />} />
        </Route>
        <Route path="properties" element={<PropertiesView />} />
        <Route path="reports" element={<ReportsView />} />
        <Route path="team" element={<TeamView />} />
        <Route path="contacts">
          <Route index element={<ContactsView />} />
          <Route path=":contactId" element={<ContactDetailView />} />
        </Route>
        <Route path="settings/:tab?" element={<SettingsView />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SessionManager />
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
