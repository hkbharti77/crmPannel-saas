import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { InboxView } from '@/components/inbox/InboxView';
import { ChatRoomView } from '@/components/chatroom/ChatRoomView';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { LeadDetailView } from '@/components/leaddetail/LeadDetailView';
import { AppointmentsView } from '@/components/appointments/AppointmentsView';
import { GlassCard } from '@/components/ui/primitives';
import type { ViewId } from '@/lib/navigation';
import { Construction } from 'lucide-react';

function Placeholder({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-8">
      <GlassCard className="flex flex-col items-center justify-center p-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-xl2 bg-gradient-accent-soft">
          <Construction className="h-7 w-7 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-primary-c">{label}</h3>
        <p className="mt-1 max-w-sm text-sm text-secondary-c">
          This screen is part of the upcoming build stages. Reply with the next
          stage number to continue.
        </p>
      </GlassCard>
    </div>
  );
}

const VIEWS: Record<ViewId, { label: string; built: boolean }> = {
  dashboard: { label: 'Dashboard', built: true },
  inbox: { label: 'Inbox', built: true },
  chatroom: { label: 'Chat Room', built: true },
  pipeline: { label: 'Pipeline', built: true },
  leaddetail: { label: 'Lead Detail', built: true },
  appointments: { label: 'Appointments', built: true },
  booking: { label: 'Booking', built: false },
  tickets: { label: 'Tickets', built: false },
  emails: { label: 'Emails', built: false },
  settings: { label: 'Settings', built: false },
};

export default function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const meta = VIEWS[view];

  return (
    <ThemeProvider>
      <AppShell current={view} onNavigate={setView}>
        {meta.built && view === 'dashboard' ? (
          <DashboardView onNavigate={(v) => setView(v as ViewId)} />
        ) : meta.built && view === 'inbox' ? (
          <InboxView onOpenChat={() => setView('chatroom')} />
        ) : meta.built && view === 'chatroom' ? (
          <ChatRoomView onBack={() => setView('inbox')} />
        ) : meta.built && view === 'pipeline' ? (
          <PipelineView onOpenLead={() => setView('leaddetail')} />
        ) : meta.built && view === 'leaddetail' ? (
          <LeadDetailView onBack={() => setView('pipeline')} />
        ) : meta.built && view === 'appointments' ? (
          <AppointmentsView />
        ) : (
          <Placeholder label={meta.label} />
        )}
      </AppShell>
    </ThemeProvider>
  );
}
