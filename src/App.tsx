import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { InboxView } from '@/components/inbox/InboxView';
import { ChatRoomView } from '@/components/chatroom/ChatRoomView';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { BroadcastsView } from '@/components/broadcasts/BroadcastsView';
import { LeadDetailView } from '@/components/leaddetail/LeadDetailView';
import { AppointmentsView } from '@/components/appointments/AppointmentsView';
import { BookingView } from '@/components/booking/BookingView';
import { TicketsView } from '@/components/tickets/TicketsView';
import { EmailsView } from '@/components/emails/EmailsView';
import { SettingsView } from '@/components/settings/SettingsView';
import type { ViewId } from '@/lib/navigation';
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
import type { AdminViewId } from '@/lib/adminNavigation';

function AppContent() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'crm' | 'admin'>('crm');
  const [view, setView] = useState<ViewId>('dashboard');
  const [adminView, setAdminView] = useState<AdminViewId>('overview');

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (mode === 'admin') {
    return (
      <AdminShell
        current={adminView}
        onNavigate={setAdminView}
        onExitAdmin={() => setMode('crm')}
      >
        {adminView === 'overview' && <AdminOverview onNavigate={(v) => setAdminView(v)} />}
        {adminView === 'tenants' && <AdminTenants />}
        {adminView === 'analytics' && <AdminAnalytics />}
        {adminView === 'health' && <AdminHealth />}
        {adminView === 'audit' && <AdminAudit />}
        {adminView === 'tickets' && <AdminTickets />}
        {adminView === 'subscriptions' && <AdminSubscriptions />}
        {adminView === 'users' && <AdminUsers />}
        {adminView === 'search' && <AdminSearch />}
        {adminView === 'settings' && <AdminSettings />}
        {adminView === 'templates' && <AdminTemplates />}
      </AdminShell>
    );
  }

  return (
    <AppShell current={view} onNavigate={setView} onEnterAdmin={() => setMode('admin')}>
      {view === 'dashboard' && <DashboardView onNavigate={(v) => setView(v as ViewId)} />}
      {view === 'inbox' && <InboxView onOpenChat={() => setView('chatroom')} />}
      {view === 'chatroom' && <ChatRoomView onBack={() => setView('inbox')} />}
      {view === 'pipeline' && <PipelineView onOpenLead={() => setView('leaddetail')} />}
      {view === 'broadcasts' && <BroadcastsView />}
      {view === 'leaddetail' && <LeadDetailView onBack={() => setView('pipeline')} />}
      {view === 'appointments' && <AppointmentsView />}
      {view === 'booking' && <BookingView />}
      {view === 'tickets' && <TicketsView />}
      {view === 'emails' && <EmailsView />}
      {view === 'settings' && <SettingsView />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
