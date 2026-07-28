import { useState, useCallback } from 'react';
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
import { MetaConfigView } from '@/components/meta/MetaConfigView';
import { KnowledgeBaseView } from '@/components/knowledge/KnowledgeBaseView';
import { LeadDetailView } from '@/components/leaddetail/LeadDetailView';
import { AppointmentsView } from '@/components/appointments/AppointmentsView';
import { BookingView } from '@/components/booking/BookingView';
import { TicketsView } from '@/components/tickets/TicketsView';
import { EmailsView } from '@/components/emails/EmailsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { PropertiesView } from '@/components/properties/PropertiesView';
import { ReportsView } from '@/components/reports/ReportsView';
import { TeamView } from '@/components/team/TeamView';
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

// ---------------------------------------------------------------------------
// Helpers – read/write navigation state from localStorage so the active
// page survives a browser refresh instead of always defaulting to 'dashboard'.
// ---------------------------------------------------------------------------
const VALID_VIEWS: ViewId[] = [
  'dashboard','inbox','chatroom','pipeline','broadcasts','meta-config',
  'knowledge-base','leaddetail','appointments','booking','tickets',
  'emails','properties','reports','team','settings',
];
const VALID_ADMIN_VIEWS: AdminViewId[] = [
  'overview','tenants','analytics','health','audit','tickets',
  'subscriptions','users','search','settings','templates',
];

function readView(): ViewId {
  const saved = localStorage.getItem('crm_active_view') as ViewId | null;
  // 'chatroom' and 'leaddetail' are sub-pages that depend on runtime state,
  // so we fall back to their parent pages on a cold refresh.
  if (saved === 'chatroom') return 'inbox';
  if (saved === 'leaddetail') return 'pipeline';
  return saved && VALID_VIEWS.includes(saved) ? saved : 'dashboard';
}

function readAdminView(): AdminViewId {
  const saved = localStorage.getItem('crm_admin_view') as AdminViewId | null;
  return saved && VALID_ADMIN_VIEWS.includes(saved) ? saved : 'overview';
}

function readMode(): 'crm' | 'admin' {
  return localStorage.getItem('crm_mode') === 'admin' ? 'admin' : 'crm';
}

function AppContent() {
  const { user, loading } = useAuth();
  const [mode, setModeState] = useState<'crm' | 'admin'>(readMode);
  const [view, setViewState] = useState<ViewId>(readView);
  const [adminView, setAdminViewState] = useState<AdminViewId>(readAdminView);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeLeadObj, setActiveLeadObj] = useState<any>(null);

  // Wrap setters to persist to localStorage on every navigation.
  const setView = useCallback((v: ViewId) => {
    localStorage.setItem('crm_active_view', v);
    setViewState(v);
  }, []);

  const setAdminView = useCallback((v: AdminViewId) => {
    localStorage.setItem('crm_admin_view', v);
    setAdminViewState(v);
  }, []);

  const setMode = useCallback((m: 'crm' | 'admin') => {
    localStorage.setItem('crm_mode', m);
    setModeState(m);
  }, []);

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

  const roleUpper = (user?.role || '').toUpperCase();
  const isSuperAdmin =
    user?.isSuperAdmin === true ||
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'PLATFORM_ADMIN' ||
    user?.email?.toLowerCase() === 'gyanvaniai@gmail.com' ||
    user?.email?.toLowerCase().startsWith('superadmin');

  if (mode === 'admin' && isSuperAdmin) {
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
      {view === 'inbox' && (
        <InboxView
          onOpenChat={(contactId) => {
            if (contactId) setActiveContactId(contactId);
            setView('chatroom');
          }}
        />
      )}
      {view === 'chatroom' && (
        <ChatRoomView
          contactId={activeContactId}
          onBack={() => setView('inbox')}
        />
      )}
      {view === 'pipeline' && (
        <PipelineView
          onOpenLead={(lead) => {
            if (lead?.id) setActiveLeadId(lead.id);
            setActiveLeadObj(lead);
            setView('leaddetail');
          }}
        />
      )}
      {view === 'broadcasts' && <BroadcastsView />}
      {view === 'meta-config' && <MetaConfigView />}
      {view === 'knowledge-base' && <KnowledgeBaseView />}
      {view === 'leaddetail' && (
        <LeadDetailView
          leadId={activeLeadId}
          leadObj={activeLeadObj}
          onBack={() => setView('pipeline')}
        />
      )}
      {view === 'appointments' && <AppointmentsView />}
      {view === 'booking' && <BookingView />}
      {view === 'tickets' && <TicketsView />}
      {view === 'emails' && <EmailsView />}
      {view === 'properties' && <PropertiesView />}
      {view === 'reports' && <ReportsView />}
      {view === 'team' && <TeamView />}
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
