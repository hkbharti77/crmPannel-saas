import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/primitives';
import { Loader2, AlertTriangle, ArrowLeft, Bot, Mail, Phone, Hash, UserSquare, Tag as TagIcon, Plus, Target, Calendar, ClipboardList } from 'lucide-react';
import { fetchContactById, toggleContactBot, type ContactDTO } from '@/lib/contactsApi';
import { fetchLeadsByContactId, type LeadDTO } from '@/lib/leadsApi';
import { fetchBookingsByContactId, type BookingDto } from '@/lib/bookingsApi';
import { fetchAppointmentsByContactId, type AppointmentDto } from '@/lib/appointmentsApi';

type TabType = 'overview' | 'leads' | 'bookings' | 'appointments';

export function ContactDetailView() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<ContactDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [togglingBot, setTogglingBot] = useState(false);
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    async function load() {
      if (!contactId) return;
      setLoading(true);
      const [res, leadsRes, bookingsRes, appointmentsRes] = await Promise.all([
        fetchContactById(contactId),
        fetchLeadsByContactId(contactId),
        fetchBookingsByContactId(contactId),
        fetchAppointmentsByContactId(contactId)
      ]);

      if (res.error) {
        setApiError(res.error);
      } else if (res.data) {
        setContact(res.data);
      }
      if (leadsRes.data) setLeads(leadsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      setLoading(false);
    }
    load();
  }, [contactId]);

  const handleToggleBot = async () => {
    if (!contact) return;
    setTogglingBot(true);
    const newStatus = !contact.botPaused;
    const res = await toggleContactBot(contact.id, newStatus);
    if (!res.error) {
      setContact(prev => prev ? { ...prev, botPaused: newStatus } : null);
    }
    setTogglingBot(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-sm text-muted-c">Loading contact details...</p>
      </div>
    );
  }

  if (apiError || !contact) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-4 text-danger-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading contact: {apiError || 'Not found'}</span>
        </div>
        <button onClick={() => navigate('/contacts')} className="mt-4 flex items-center gap-2 text-sm text-primary-500 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: typeof UserSquare; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: UserSquare },
    { id: 'leads', label: 'Leads', icon: Target, count: leads.length },
    { id: 'bookings', label: 'Bookings', icon: ClipboardList, count: bookings.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6 animate-fade-in">
      {/* Header / Nav */}
      <button 
        onClick={() => navigate('/contacts')} 
        className="flex items-center gap-2 text-sm font-medium text-muted-c transition-colors hover:text-primary-c"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </button>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          {/* Profile Card */}
          <GlassCard className="flex flex-col items-center p-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-accent text-3xl font-bold text-white shadow-soft-lg mb-4">
              {contact.name ? contact.name.substring(0, 2).toUpperCase() : 'C'}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary-c">{contact.name || 'Unknown User'}</h1>
            <div className="mt-2 flex flex-col gap-1.5 text-sm text-secondary-c">
              {contact.phone && (
                <span className="flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-c" /> {contact.phone}</span>
              )}
              {contact.email && (
                <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-c" /> {contact.email}</span>
              )}
            </div>

            <div className="mt-6 flex w-full flex-col gap-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
                <UserSquare className="h-4 w-4" /> Open Chat
              </button>
              <button
                onClick={handleToggleBot}
                disabled={togglingBot}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  contact.botPaused 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-ink-800 dark:text-slate-300 dark:hover:bg-ink-700' 
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20'
                }`}
              >
                {togglingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {contact.botPaused ? 'Resume Bot' : 'Pause Bot'}
              </button>
            </div>
          </GlassCard>

          {/* Properties Card */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-xs font-bold text-primary-c uppercase tracking-wider">Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-muted-c font-medium uppercase tracking-wider">WhatsApp ID</label>
                <p className="mt-1 flex items-center gap-2 text-sm text-primary-c font-mono">
                  <Hash className="h-3.5 w-3.5 text-muted-c" /> {contact.waId || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-[11px] text-muted-c font-medium uppercase tracking-wider">Source</label>
                <p className="mt-1 text-sm text-primary-c">{contact.source || 'Manual'}</p>
              </div>
              <div>
                <label className="text-[11px] text-muted-c font-medium uppercase tracking-wider">Bot Status</label>
                <p className="mt-1">
                  {contact.botPaused ? (
                    <span className="inline-flex items-center gap-1 rounded bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                      Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">
                      Active
                    </span>
                  )}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Tags Card */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold text-primary-c uppercase tracking-wider">Tags</h3>
              <button className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                <Plus className="h-3 w-3" /> Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {contact.tags && contact.tags.length > 0 ? (
                contact.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 rounded-lg border border-base-c bg-slate-50 px-2.5 py-1 text-xs font-medium text-secondary-c dark:bg-ink-800">
                    <TagIcon className="h-3 w-3 text-muted-c" /> {tag}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-c">No tags assigned.</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-base-c scrollbar-none">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-muted-c hover:border-slate-300 hover:text-secondary-c dark:hover:border-ink-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                      isActive 
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' 
                        : 'bg-slate-100 text-muted-c dark:bg-ink-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="rounded-full bg-primary-50 p-4 dark:bg-primary-500/10 mb-4">
                  <UserSquare className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-primary-c">Contact Overview</h3>
                <p className="mt-2 max-w-md text-sm text-secondary-c">
                  This contact has {leads.length} active leads, {bookings.length} bookings, and {appointments.length} scheduled appointments. Select a tab above to view detailed history.
                </p>
              </GlassCard>
            )}

            {activeTab === 'leads' && (
              <GlassCard className="p-0 overflow-hidden">
                <div className="p-5 border-b border-base-c flex items-center justify-between bg-slate-50/50 dark:bg-ink-900/50">
                  <h3 className="text-sm font-bold text-primary-c uppercase tracking-wider">Lead Pipeline</h3>
                </div>
                <div className="p-2 sm:p-5">
                  {leads.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                      {leads.map(lead => (
                        <div key={lead.id} className="group relative flex flex-col justify-between rounded-xl border border-base-c bg-card-c p-4 transition-all hover:border-primary-500/30 hover:shadow-md cursor-pointer" onClick={() => navigate(`/leaddetail/${lead.id}`)}>
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                {lead.status}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-primary-c group-hover:text-primary-500 transition-colors">{lead.leadNumber}</h4>
                            <p className="mt-1 text-sm text-muted-c line-clamp-1">{lead.notes || 'No notes provided'}</p>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-base-c pt-4">
                            <span className="text-xs font-medium text-secondary-c">Deal Value</span>
                            <span className="text-sm font-bold text-primary-c">{lead.dealValue ? `${lead.currency || '₹'}${lead.dealValue.toLocaleString()}` : 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Target className="h-12 w-12 text-muted-c/30 mb-4" />
                      <h4 className="text-base font-medium text-primary-c">No Leads Found</h4>
                      <p className="mt-1 text-sm text-muted-c">This contact has no active leads in the pipeline.</p>
                      <button className="mt-6 flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 transition-colors">
                        <Plus className="h-4 w-4" /> Create Lead
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeTab === 'bookings' && (
              <GlassCard className="p-0 overflow-hidden">
                <div className="p-5 border-b border-base-c flex items-center justify-between bg-slate-50/50 dark:bg-ink-900/50">
                  <h3 className="text-sm font-bold text-primary-c uppercase tracking-wider">Bookings History</h3>
                </div>
                <div className="divide-y divide-base-c">
                  {bookings.length > 0 ? (
                    bookings.map(booking => (
                      <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 dark:hover:bg-ink-850 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-500/10">
                            <ClipboardList className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-c">{booking.service}</h4>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-c">
                              <Calendar className="h-3.5 w-3.5" /> {booking.preferredSlot || 'No slot selected'}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            booking.status === 'CONFIRMED' ? 'bg-success-500/10 text-success-600 dark:text-success-400' :
                            booking.status === 'CANCELLED' ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400' :
                            'bg-slate-200 text-slate-700 dark:bg-ink-700 dark:text-slate-300'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ClipboardList className="h-12 w-12 text-muted-c/30 mb-4" />
                      <h4 className="text-base font-medium text-primary-c">No Bookings Found</h4>
                      <p className="mt-1 text-sm text-muted-c">This contact has no past or upcoming service bookings.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeTab === 'appointments' && (
              <GlassCard className="p-0 overflow-hidden">
                <div className="p-5 border-b border-base-c flex items-center justify-between bg-slate-50/50 dark:bg-ink-900/50">
                  <h3 className="text-sm font-bold text-primary-c uppercase tracking-wider">Appointments</h3>
                </div>
                <div className="divide-y divide-base-c">
                  {appointments.length > 0 ? (
                    appointments.map(app => (
                      <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 dark:hover:bg-ink-850 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-warning-50 p-3 dark:bg-warning-500/10">
                            <Calendar className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-c">{app.title}</h4>
                            <p className="mt-1 text-xs text-muted-c">
                              {app.appointmentDateTime ? new Date(app.appointmentDateTime).toLocaleString(undefined, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : 'Date not set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'BOOKED' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' :
                            app.status === 'COMPLETED' ? 'bg-success-500/10 text-success-600 dark:text-success-400' :
                            'bg-slate-200 text-slate-700 dark:bg-ink-700 dark:text-slate-300'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Calendar className="h-12 w-12 text-muted-c/30 mb-4" />
                      <h4 className="text-base font-medium text-primary-c">No Appointments</h4>
                      <p className="mt-1 text-sm text-muted-c">No appointments have been scheduled with this contact.</p>
                      <button className="mt-6 flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 transition-colors">
                        <Plus className="h-4 w-4" /> Schedule Appointment
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
