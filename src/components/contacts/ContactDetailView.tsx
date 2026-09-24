import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  Bot, 
  Mail, 
  Phone, 
  Hash, 
  UserSquare, 
  Tag as TagIcon, 
  Plus, 
  Target, 
  Calendar, 
  ClipboardList, 
  ShieldOff, 
  ShieldCheck,
  Fingerprint,
  Copy,
  Check,
  IndianRupee,
  MessageSquare,
  Smartphone,
  Activity,
  ChevronRight
} from 'lucide-react';
import { fetchContactById, toggleContactBot, updateContactConsent, type ContactDTO } from '@/lib/contactsApi';
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
  const [updatingConsent, setUpdatingConsent] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConsentToggle = async (channel: 'WHATSAPP' | 'EMAIL' | 'SMS', currentStatus?: string) => {
    if (!contact) return;
    setUpdatingConsent(channel);
    const nextStatus = currentStatus === 'OPTED_IN' ? 'OPTED_OUT' : 'OPTED_IN';
    const res = await updateContactConsent(contact.id, {
      channel,
      status: nextStatus,
      reason: 'Toggled manually by admin from Contact Detail View'
    });
    if (!res.error && res.data) {
      const consentData = res.data;
      setContact(prev => prev ? {
        ...prev,
        whatsappConsentStatus: channel === 'WHATSAPP' ? consentData.whatsappConsentStatus : prev.whatsappConsentStatus,
        emailConsentStatus: channel === 'EMAIL' ? consentData.emailConsentStatus : prev.emailConsentStatus,
        smsConsentStatus: channel === 'SMS' ? consentData.smsConsentStatus : prev.smsConsentStatus,
        marketingOptedOut: consentData.marketingOptedOut
      } : null);
    }
    setUpdatingConsent(null);
  };

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 dark:bg-primary-500/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-primary-c">Loading Contact Profile</h3>
        <p className="mt-1 text-xs text-muted-c">Retrieving profile, consent status, pipeline, and booking history...</p>
      </div>
    );
  }

  if (apiError || !contact) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <GlassCard className="p-8 text-center border-danger-500/20 bg-danger-500/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-500/10 text-danger-500 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-primary-c">Unable to Load Contact</h2>
          <p className="mt-1 text-sm text-muted-c max-w-md mx-auto">{apiError || 'The requested contact could not be found or has been removed.'}</p>
          <button 
            onClick={() => navigate('/contacts')} 
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Contacts Directory
          </button>
        </GlassCard>
      </div>
    );
  }

  // Calculate aggregate stats
  const totalDealValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const activeLeadsCount = leads.filter(l => l.status !== 'LOST' && l.status !== 'CLOSED').length;
  const upcomingAppointmentsCount = appointments.filter(a => a.status === 'BOOKED').length;

  const tabs: { id: TabType; label: string; icon: typeof UserSquare; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'leads', label: 'Leads Pipeline', icon: Target, count: leads.length },
    { id: 'bookings', label: 'Bookings', icon: ClipboardList, count: bookings.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
  ];

  const initials = contact.name 
    ? contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'C';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/contacts')} 
          className="group flex items-center gap-2 text-xs font-semibold text-muted-c transition-colors hover:text-primary-500 cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-base-c bg-card-c transition-transform group-hover:-translate-x-0.5 shadow-xs">
            <ArrowLeft className="h-3.5 w-3.5 text-primary-500" />
          </div>
          <span>Back to Contacts</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={contact.botPaused ? 'warning' : 'success'}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
            {contact.botPaused ? 'Bot Paused' : 'Bot Active'}
          </Badge>
          {contact.marketingOptedOut ? (
            <Badge variant="danger">
              <ShieldOff className="h-3 w-3 mr-1" /> Opted Out
            </Badge>
          ) : (
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3 mr-1" /> Marketing Opt-In
            </Badge>
          )}
        </div>
      </div>

      {/* Main Executive Banner Card */}
      <GlassCard className="relative overflow-hidden p-6 lg:p-8">
        {/* Ambient Background Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Contact Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-accent text-2xl font-black text-white shadow-soft-lg ring-4 ring-white/20 dark:ring-slate-800">
              {initials}
              {!contact.botPaused && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900" title="AI Bot Operational">
                  <Bot className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-primary-c sm:text-3xl">
                  {contact.name || 'Unnamed Contact'}
                </h1>
                {contact.source && (
                  <span className="rounded-md border border-base-c bg-subtle-c px-2 py-0.5 text-[11px] font-semibold text-muted-c uppercase tracking-wider">
                    {contact.source}
                  </span>
                )}
              </div>

              {/* Quick Communication Info Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-secondary-c">
                {contact.phone && (
                  <button 
                    onClick={() => handleCopy(contact.phone!, 'phone')}
                    className="flex items-center gap-1.5 hover:text-primary-500 transition-colors group cursor-pointer"
                    title="Click to copy phone"
                  >
                    <Smartphone className="h-3.5 w-3.5 text-muted-c group-hover:text-primary-500" />
                    <span className="font-mono">{contact.phone}</span>
                    {copiedField === 'phone' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-c transition-opacity" />
                    )}
                  </button>
                )}

                {contact.email && (
                  <button 
                    onClick={() => handleCopy(contact.email!, 'email')}
                    className="flex items-center gap-1.5 hover:text-primary-500 transition-colors group cursor-pointer"
                    title="Click to copy email"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-c group-hover:text-primary-500" />
                    <span>{contact.email}</span>
                    {copiedField === 'email' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-c transition-opacity" />
                    )}
                  </button>
                )}

                {contact.waId && (
                  <span className="flex items-center gap-1.5 font-mono text-muted-c">
                    <Hash className="h-3.5 w-3.5 text-emerald-500" />
                    <span>WA ID: {contact.waId}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleToggleBot}
              disabled={togglingBot}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                contact.botPaused 
                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {togglingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {contact.botPaused ? 'Resume AI Bot' : 'Pause AI Bot'}
            </button>

            <button className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <MessageSquare className="h-4 w-4" /> Open Live Chat
            </button>
          </div>

        </div>
      </GlassCard>

      {/* Main Grid: Left Properties & Consent Sidebar | Right Tabs & Detailed Panels */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Sidebar Column */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          
          {/* Properties Card */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-base-c pb-3">
              <h3 className="text-xs font-bold text-primary-c uppercase tracking-wider flex items-center gap-2">
                <UserSquare className="h-4 w-4 text-primary-500" /> Contact Details
              </h3>
            </div>
            
            <div className="space-y-4">
              {contact.waId && (
                <div>
                  <label className="text-[11px] text-muted-c font-semibold uppercase tracking-wider">WhatsApp ID</label>
                  <p className="mt-1 flex items-center justify-between text-xs font-mono text-primary-c bg-subtle-c p-2 rounded-lg border border-base-c">
                    <span>{contact.waId}</span>
                    <button onClick={() => handleCopy(contact.waId!, 'waId')} className="text-muted-c hover:text-primary-500 cursor-pointer">
                      {copiedField === 'waId' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </p>
                </div>
              )}

              {contact.bsuid && (
                <div>
                  <label className="text-[11px] text-muted-c font-semibold uppercase tracking-wider">Meta BSUID</label>
                  <p className="mt-1 flex items-center justify-between text-xs font-mono text-primary-c bg-subtle-c p-2 rounded-lg border border-base-c break-all">
                    <span className="truncate mr-2" title={contact.bsuid}>{contact.bsuid}</span>
                    <button onClick={() => handleCopy(contact.bsuid!, 'bsuid')} className="text-muted-c hover:text-primary-500 shrink-0 cursor-pointer">
                      {copiedField === 'bsuid' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </p>
                </div>
              )}

              {contact.parentBsuid && (
                <div>
                  <label className="text-[11px] text-muted-c font-semibold uppercase tracking-wider">Portfolio Parent BSUID</label>
                  <p className="mt-1 flex items-center justify-between text-xs font-mono text-secondary-c bg-subtle-c p-2 rounded-lg border border-base-c break-all">
                    <span className="truncate mr-2" title={contact.parentBsuid}>{contact.parentBsuid}</span>
                    <button onClick={() => handleCopy(contact.parentBsuid!, 'parentBsuid')} className="text-muted-c hover:text-primary-500 shrink-0 cursor-pointer">
                      {copiedField === 'parentBsuid' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </p>
                </div>
              )}

              <div>
                <label className="text-[11px] text-muted-c font-semibold uppercase tracking-wider">Acquisition Source</label>
                <p className="mt-1 text-xs font-semibold text-primary-c">{contact.source || 'Direct / Manual Entry'}</p>
              </div>

              <div>
                <label className="text-[11px] text-muted-c font-semibold uppercase tracking-wider">Bot Automation</label>
                <div className="mt-1">
                  {contact.botPaused ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Bot className="h-3.5 w-3.5" /> Operations Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Bot className="h-3.5 w-3.5" /> Bot Operational
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Privacy & Channel Consent Controls Card */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-base-c pb-3">
              <h3 className="text-xs font-bold text-primary-c uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> DPDP Channel Consents
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* WhatsApp Consent */}
              <div className="flex items-center justify-between rounded-xl bg-subtle-c p-3 border border-base-c">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-primary-c">WhatsApp</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-c font-medium">
                    {contact.whatsappConsentStatus === 'OPTED_IN' ? 'Opted In' : contact.whatsappConsentStatus === 'OPTED_OUT' || contact.marketingOptedOut ? 'Opted Out' : 'Default / Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleConsentToggle('WHATSAPP', contact.whatsappConsentStatus)}
                  disabled={updatingConsent === 'WHATSAPP'}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-xs cursor-pointer ${
                    contact.whatsappConsentStatus === 'OPTED_IN'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400'
                  }`}
                >
                  {updatingConsent === 'WHATSAPP' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    contact.whatsappConsentStatus === 'OPTED_IN' ? 'Opt Out' : 'Opt In'
                  )}
                </button>
              </div>

              {/* Email Consent */}
              <div className="flex items-center justify-between rounded-xl bg-subtle-c p-3 border border-base-c">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-primary-c">Email</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-c font-medium">
                    {contact.emailConsentStatus === 'OPTED_IN' ? 'Opted In' : contact.emailConsentStatus === 'OPTED_OUT' ? 'Opted Out' : 'Default / Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleConsentToggle('EMAIL', contact.emailConsentStatus)}
                  disabled={updatingConsent === 'EMAIL'}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-xs cursor-pointer ${
                    contact.emailConsentStatus === 'OPTED_IN'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400'
                  }`}
                >
                  {updatingConsent === 'EMAIL' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    contact.emailConsentStatus === 'OPTED_IN' ? 'Opt Out' : 'Opt In'
                  )}
                </button>
              </div>

              {/* SMS Consent */}
              <div className="flex items-center justify-between rounded-xl bg-subtle-c p-3 border border-base-c">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-bold text-primary-c">SMS</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-c font-medium">
                    {contact.smsConsentStatus === 'OPTED_IN' ? 'Opted In' : contact.smsConsentStatus === 'OPTED_OUT' ? 'Opted Out' : 'Default / Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleConsentToggle('SMS', contact.smsConsentStatus)}
                  disabled={updatingConsent === 'SMS'}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-xs cursor-pointer ${
                    contact.smsConsentStatus === 'OPTED_IN'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400'
                  }`}
                >
                  {updatingConsent === 'SMS' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    contact.smsConsentStatus === 'OPTED_IN' ? 'Opt Out' : 'Opt In'
                  )}
                </button>
              </div>

              {contact.marketingOptedOutAt && (
                <div className="rounded-lg bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span className="font-semibold">Marketing Opt-Out recorded:</span> {new Date(contact.marketingOptedOutAt).toLocaleDateString()}
                  {contact.marketingOptOutSource && ` via ${contact.marketingOptOutSource}`}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Tag Badges Card */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-primary-c uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-indigo-500" /> Segment Tags
              </h3>
              <button className="flex items-center gap-1 text-[11px] font-bold text-primary-500 hover:underline cursor-pointer">
                <Plus className="h-3 w-3" /> Add Tag
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {contact.tags && contact.tags.length > 0 ? (
                contact.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1.5 rounded-lg border border-base-c bg-subtle-c px-2.5 py-1 text-xs font-semibold text-secondary-c shadow-xs"
                  >
                    <TagIcon className="h-3 w-3 text-muted-c" /> {tag}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-c italic">No tags assigned to contact.</p>
              )}
            </div>
          </GlassCard>

        </div>

        {/* Right Column: Tab Bar & Active Tab View */}
        <div className="space-y-6 lg:col-span-8 xl:col-span-9 flex flex-col">
          
          {/* Modern Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-base-c bg-card-c p-1.5 shadow-soft scrollbar-none">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-accent text-white shadow-soft' 
                      : 'text-muted-c hover:bg-subtle-c hover:text-primary-c'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-subtle-c text-secondary-c border border-base-c'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Panes */}
          <div className="flex-1 space-y-6">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Executive KPI Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  
                  {/* Stat 1: Deal Pipeline Value */}
                  <GlassCard className="p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-c uppercase tracking-wider">Total Pipeline Value</span>
                      <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                        <IndianRupee className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-primary-c tracking-tight">
                        ₹{totalDealValue.toLocaleString()}
                      </span>
                      <p className="mt-1 text-[11px] text-muted-c">Across {leads.length} leads ({activeLeadsCount} active)</p>
                    </div>
                  </GlassCard>

                  {/* Stat 2: Bookings */}
                  <GlassCard className="p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-c uppercase tracking-wider">Service Bookings</span>
                      <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-primary-c tracking-tight">
                        {bookings.length}
                      </span>
                      <p className="mt-1 text-[11px] text-muted-c">Confirmed & past service requests</p>
                    </div>
                  </GlassCard>

                  {/* Stat 3: Appointments */}
                  <GlassCard className="p-5 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-c uppercase tracking-wider">Appointments</span>
                      <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-primary-c tracking-tight">
                        {appointments.length}
                      </span>
                      <p className="mt-1 text-[11px] text-muted-c">{upcomingAppointmentsCount} upcoming scheduled</p>
                    </div>
                  </GlassCard>

                </div>

                {/* Recent Pipeline Highlight */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-c">
                    <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary-500" /> Active Lead Pipeline
                    </h3>
                    {leads.length > 0 && (
                      <button 
                        onClick={() => setActiveTab('leads')}
                        className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        View All ({leads.length}) <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {leads.length > 0 ? (
                    <div className="space-y-3">
                      {leads.slice(0, 3).map(lead => (
                        <div 
                          key={lead.id} 
                          onClick={() => navigate(`/leaddetail/${lead.id}`)}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-base-c bg-subtle-c hover:border-primary-500/40 hover:shadow-soft cursor-pointer transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-primary-c group-hover:text-primary-500 transition-colors">
                                #{lead.leadNumber}
                              </span>
                              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                {lead.status}
                              </span>
                            </div>
                            {lead.notes && (
                              <p className="mt-1 text-xs text-muted-c line-clamp-1">{lead.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <span className="text-sm font-black text-primary-c">
                              {lead.dealValue ? `₹${lead.dealValue.toLocaleString()}` : 'N/A'}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-c group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Target className="mx-auto h-8 w-8 text-muted-c/40 mb-2" />
                      <p className="text-xs text-muted-c">No active leads currently in the pipeline for this contact.</p>
                    </div>
                  )}
                </GlassCard>

              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <GlassCard className="p-6 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-base-c">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Lead Deals</h3>
                    <p className="text-xs text-muted-c">All opportunities associated with {contact.name}</p>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.02] cursor-pointer">
                    <Plus className="h-4 w-4" /> Create Lead
                  </button>
                </div>

                {leads.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {leads.map(lead => (
                      <div 
                        key={lead.id}
                        onClick={() => navigate(`/leaddetail/${lead.id}`)}
                        className="group relative flex flex-col justify-between rounded-xl border border-base-c bg-subtle-c p-5 transition-all hover:border-primary-500/40 hover:shadow-soft-lg cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-semibold text-muted-c">#{lead.leadNumber}</span>
                            <span className="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                              {lead.status}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-c line-clamp-2 mt-2">{lead.notes || 'No description available for this lead.'}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-base-c pt-3">
                          <span className="text-xs font-medium text-muted-c">Value</span>
                          <span className="text-base font-black text-primary-c">
                            {lead.dealValue ? `${lead.currency || '₹'}${lead.dealValue.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-2xl bg-primary-500/10 p-4 text-primary-500 mb-3">
                      <Target className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-bold text-primary-c">No Leads Found</h4>
                    <p className="mt-1 text-xs text-muted-c max-w-sm">No sales or support pipeline leads exist for this contact yet.</p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <GlassCard className="p-6 space-y-4 animate-in fade-in duration-200">
                <div className="pb-3 border-b border-base-c">
                  <h3 className="text-base font-bold text-primary-c">Service Bookings</h3>
                  <p className="text-xs text-muted-c">History of service requests and slot reservations</p>
                </div>

                {bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map(booking => (
                      <div 
                        key={booking.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-base-c bg-subtle-c"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500 shrink-0">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-c">{booking.service}</h4>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-c">
                              <Calendar className="h-3.5 w-3.5 text-muted-c" /> {booking.preferredSlot || 'No slot specified'}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-center ${
                          booking.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          booking.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-500 mb-3">
                      <ClipboardList className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-bold text-primary-c">No Bookings Recorded</h4>
                    <p className="mt-1 text-xs text-muted-c">This contact has no service booking records on file.</p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <GlassCard className="p-6 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-base-c">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Scheduled Appointments</h3>
                    <p className="text-xs text-muted-c">Calendar meetings and consultation events</p>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.02] cursor-pointer">
                    <Plus className="h-4 w-4" /> Schedule Meeting
                  </button>
                </div>

                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map(app => (
                      <div 
                        key={app.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-base-c bg-subtle-c"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500 shrink-0">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-c">{app.title}</h4>
                            <p className="mt-1 text-xs text-muted-c">
                              {app.appointmentDateTime ? new Date(app.appointmentDateTime).toLocaleString(undefined, {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : 'Date TBD'}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-center ${
                          app.status === 'BOOKED' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' :
                          app.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-2xl bg-purple-500/10 p-4 text-purple-500 mb-3">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-bold text-primary-c">No Appointments Scheduled</h4>
                    <p className="mt-1 text-xs text-muted-c">There are no upcoming or past scheduled meetings for this contact.</p>
                  </div>
                )}
              </GlassCard>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
