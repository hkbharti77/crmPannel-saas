import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  SERVICES as DEFAULT_SERVICES,
  type BookingService,
  type BookingFormData,
} from './bookingData';
import {
  createBooking,
  fetchBusinessServices,
  fetchBookings,
  completeBooking,
  cancelBooking,
  type BusinessServiceDto,
  type BookingDto,
} from '@/lib/bookingsApi';
import {
  MapPin,
  MonitorPlay,
  Phone,
  Users,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CalendarCheck,
  PartyPopper,
  Video,
  Loader2,
  RefreshCw,
  Search,
  Plus,
  XCircle,
  CheckCircle2,
  ListFilter,
  FileText,
  User,
  X,
  Star,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

const SERVICE_ICONS: Record<string, typeof MapPin> = {
  MapPin,
  MonitorPlay,
  Phone,
  Users,
};

export function extractSlotFromBooking(b: BookingDto): string {
  if (b.preferredSlot && b.preferredSlot.trim() !== '') {
    return b.preferredSlot;
  }
  if (b.collectedData) {
    let dateVal = '';
    let timeVal = '';
    for (const [key, val] of Object.entries(b.collectedData)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('date')) {
        dateVal = String(val);
      } else if (lowerKey.includes('time') || lowerKey.includes('slot') || lowerKey.includes('timing') || lowerKey.includes('contact')) {
        timeVal = String(val);
      }
    }
    if (dateVal && timeVal) return `${dateVal} (${timeVal})`;
    if (dateVal) return dateVal;
    if (timeVal) return timeVal;
  }
  return 'Flexible Timing';
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Service', 'Date & Time', 'Details', 'Confirm'];

export function BookingView() {
  // Main view mode: 'list' (Customer Bookings Table) or 'wizard' (Step-by-Step Creation)
  const [activeTab, setActiveTab] = useState<'list' | 'wizard'>('list');

  // Bookings Data & Filters
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [form, setForm] = useState<BookingFormData>({
    serviceId: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: '',
  });

  const loadBookingsData = async () => {
    setLoadingBookings(true);
    const { data } = await fetchBookings();
    setLoadingBookings(false);
    if (data) {
      setBookings(data);
    }
  };

  useEffect(() => {
    loadBookingsData();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      const { data } = await fetchBusinessServices();
      setLoadingServices(false);

      if (data && data.length > 0) {
        const colors = ['#10B981', '#7C3AED', '#2563EB', '#F59E0B'];
        const mapped: BookingService[] = data.map((bs: BusinessServiceDto, idx: number) => ({
          id: bs.id,
          title: bs.name,
          description: bs.description || 'Configured business service',
          duration: '60 min',
          durationMins: 60,
          icon: idx % 2 === 0 ? 'MapPin' : 'MonitorPlay',
          color: colors[idx % colors.length],
          bgColor: `${colors[idx % colors.length]}18`,
          price: 'Free',
          popular: idx === 0,
        }));
        setServices(mapped);
      }
    };
    loadServices();
  }, []);

  const handleComplete = async (id: string) => {
    setActionLoadingId(id);
    await completeBooking(id);
    setActionLoadingId(null);
    loadBookingsData();
  };

  const handleCancel = async (id: string) => {
    setActionLoadingId(id);
    await cancelBooking(id);
    setActionLoadingId(null);
    loadBookingsData();
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const matchesStatus = b.status?.toUpperCase() === statusFilter;
        if (!matchesStatus) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (b.contactName || '').toLowerCase();
        const waId = (b.contactWaId || '').toLowerCase();
        const service = (b.service || '').toLowerCase();
        const source = (b.source || '').toLowerCase();
        return name.includes(q) || waId.includes(q) || service.includes(q) || source.includes(q);
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId) ?? null,
    [services, form.serviceId],
  );

  const canProceed = () => {
    if (step === 1) return !!form.serviceId;
    if (step === 2) return !!form.date && !!form.time;
    if (step === 3) return form.name.trim().length > 0 && form.phone.trim().length > 0;
    return true;
  };

  const next = async () => {
    if (canProceed() && step < 4) {
      if (step === 3) {
        setSubmitting(true);
        await createBooking({
          service: selectedService?.title || 'Site Visit',
          preferredSlot: `${form.date} ${form.time}`,
          notes: form.notes,
          collectedData: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            company: form.company,
          },
          source: 'Web Booking Wizard',
        });
        setSubmitting(false);
        loadBookingsData();
      }
      setStep((step + 1) as Step);
    }
  };

  const prev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const reset = () => {
    setStep(1);
    setForm({ serviceId: '', date: '', time: '', name: '', phone: '', email: '', company: '', notes: '' });
  };

  const pendingCount = bookings.filter((b) => b.status === 'PENDING' || !b.status).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Customer Service Bookings
          </h2>
          <p className="mt-0.5 text-xs text-secondary-c">
            Track and manage incoming service booking requests from WhatsApp, Web Chat Widget, and Forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TabSwitcher
            tabs={[
              { id: 'list', label: `Bookings List (${bookings.length})`, icon: <FileText className="h-3.5 w-3.5" /> },
              { id: 'wizard', label: 'New Booking', icon: <Plus className="h-3.5 w-3.5" /> }
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'list' | 'wizard')}
          />

          {activeTab === 'list' && (
            <button
              onClick={loadBookingsData}
              disabled={loadingBookings}
              className="grid h-9 w-9 place-items-center rounded-xl border border-base-c bg-card-c text-secondary-c hover:text-primary-c transition-colors disabled:opacity-50"
              title="Refresh Bookings"
            >
              <RefreshCw className={cx('h-4 w-4', loadingBookings && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: BOOKINGS MANAGEMENT DASHBOARD */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GlassCard className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-c">Total Bookings</p>
                <p className="text-lg font-bold text-primary-c">{bookings.length}</p>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-c">Pending Review</p>
                <p className="text-lg font-bold text-primary-c">{pendingCount}</p>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-c">Completed</p>
                <p className="text-lg font-bold text-primary-c">{completedCount}</p>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-c">Cancelled</p>
                <p className="text-lg font-bold text-primary-c">{cancelledCount}</p>
              </div>
            </GlassCard>
          </div>

          {/* Search & Filter Bar */}
          <GlassCard className="p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-c" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name, phone, service or source..."
                  className="form-input pl-9"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <ListFilter className="h-3.5 w-3.5 text-muted-c mr-1 shrink-0" />
                {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cx(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all',
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-subtle-c text-secondary-c hover:bg-slate-200 dark:hover:bg-ink-800',
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Bookings List / Data Table */}
          {loadingBookings ? (
            <GlassCard className="p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-2 text-sm text-secondary-c">Loading customer bookings data…</p>
            </GlassCard>
          ) : filteredBookings.length === 0 ? (
            <GlassCard className="p-12 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-primary-c">No Customer Bookings Found</h3>
              <p className="mx-auto max-w-sm text-xs text-muted-c">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No bookings match your current search or status filter criteria.'
                  : 'Customer service bookings created via WhatsApp or Chat Widget will appear here.'}
              </p>
              <button
                onClick={() => setActiveTab('wizard')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
              >
                <Plus className="h-3.5 w-3.5" /> Create First Booking
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const name = b.contactName || b.collectedData?.name || b.contactWaId || 'Anonymous Customer';
                const phone = b.collectedData?.phone || b.contactWaId || 'N/A';
                const email = b.collectedData?.email || '';
                const isPending = !b.status || b.status === 'PENDING';
                const isCompleted = b.status === 'COMPLETED';
                const isCancelled = b.status === 'CANCELLED';
                const isConfirmed = b.status === 'CONFIRMED';

                return (
                  <GlassCard key={b.id} onClick={() => setSelectedBooking(b)} className="p-4 hover:border-emerald-500/40 transition-all space-y-3 cursor-pointer">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Customer & Service Details */}
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400">
                          <User className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-primary-c">{name}</h4>
                            <span
                              className={cx(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                isCompleted && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
                                isCancelled && 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
                                isConfirmed && 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
                                isPending && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
                              )}
                            >
                              {b.status || 'PENDING'}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-c">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Service: {b.service || 'Site Visit'}
                            </span>
                            <span>• Phone: {phone}</span>
                            {email && <span>• Email: {email}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Preferred Slot & Source */}
                      <div className="flex items-center gap-4 text-xs text-secondary-c sm:text-right">
                        <div>
                          <p className="font-semibold text-primary-c flex items-center gap-1 sm:justify-end">
                            <Clock className="h-3.5 w-3.5 text-muted-c" />
                            {extractSlotFromBooking(b)}
                          </p>
                          <p className="text-[11px] text-muted-c mt-0.5">
                            Source: {b.source || 'WhatsApp Bot'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between border-t border-base-c/60 pt-3 text-xs">
                      <div className="text-[11px] text-muted-c">
                        Created: {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Recent'}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCompleted && !isCancelled && (
                          <>
                            <button
                              onClick={() => handleComplete(b.id)}
                              disabled={actionLoadingId === b.id}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoadingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={actionLoadingId === b.id}
                              className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3 w-3" /> Cancel
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Service Fulfilled
                          </span>
                        )}
                        {isCancelled && (
                          <span className="flex items-center gap-1 font-semibold text-rose-500">
                            <XCircle className="h-3.5 w-3.5" /> Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}

      {/* VIEW MODE 2: STEP-BY-STEP BOOKING WIZARD */}
      {activeTab === 'wizard' && (
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Top back button */}
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Customer Bookings List
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl2 bg-gradient-accent shadow-glow-blue">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-primary-c">Schedule New Service Booking</h2>
            <p className="mt-1 text-sm text-secondary-c">
              Schedule a site visit, demo, or consultation for a customer.
            </p>
          </div>

          {/* Stepper */}
          <StepIndicator current={step} />

          {/* Step content */}
          <GlassCard className="p-5 lg:p-6">
            {step === 1 && (
              <ServiceStep
                form={form}
                setForm={setForm}
                services={services}
                loading={loadingServices}
              />
            )}
            {step === 2 && <DateTimeStep form={form} setForm={setForm} />}
            {step === 3 && <DetailsStep form={form} setForm={setForm} />}
            {step === 4 && (
              <ConfirmStep
                form={form}
                service={selectedService}
                onReset={reset}
                onBackToList={() => {
                  reset();
                  setActiveTab('list');
                }}
              />
            )}

            {/* Navigation buttons */}
            {step < 4 && (
              <div className="mt-6 flex items-center justify-between border-t border-base-c pt-4">
                <button
                  onClick={prev}
                  disabled={step === 1 || submitting}
                  className="flex items-center gap-1 rounded-lg border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c transition-colors hover:text-primary-c disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                <button
                  onClick={next}
                  disabled={!canProceed() || submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-glow-blue transition-all hover:scale-105 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      {step === 3 ? 'Confirm & Book' : 'Continue'}{' '}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── STEP INDICATOR ──────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-between px-2 sm:px-6">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as Step;
        const isDone = current > stepNum;
        const isCurrent = current === stepNum;

        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cx(
                  'grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all',
                  isDone && 'bg-success-500 text-white',
                  isCurrent && 'bg-gradient-accent text-white ring-4 ring-blue-500/20 shadow-glow-blue',
                  !isDone && !isCurrent && 'bg-subtle-c text-muted-c border border-base-c',
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cx(
                  'mt-1 text-[11px] font-medium hidden sm:inline',
                  isCurrent ? 'text-primary-c font-semibold' : 'text-muted-c',
                )}
              >
                {label}
              </span>
            </div>

            {idx < STEP_LABELS.length - 1 && (
              <div
                className={cx(
                  'mx-2 h-0.5 flex-1 transition-all',
                  current > stepNum ? 'bg-success-500' : 'bg-border-base',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── STEP 1: CHOOSE SERVICE ───────────────────────────────────

function ServiceStep({
  form,
  setForm,
  services,
  loading,
}: {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
  services: BookingService[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
        <p className="mt-2 text-xs text-secondary-c">Loading configured business services…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-primary-c">Choose a service</h3>
        <p className="text-xs text-secondary-c">Select what you'd like to schedule.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((svc) => {
          const Icon = SERVICE_ICONS[svc.icon] ?? MapPin;
          const isSelected = form.serviceId === svc.id;

          return (
            <div
              key={svc.id}
              onClick={() => setForm((prev) => ({ ...prev, serviceId: svc.id }))}
              className={cx(
                'group relative cursor-pointer rounded-xl2 border p-4 transition-all',
                isSelected
                  ? 'border-blue-500/40 bg-blue-500/5 ring-2 ring-blue-500/20'
                  : 'border-base-c bg-subtle-c hover:border-blue-500/30 hover:bg-card-c',
              )}
            >
              {svc.popular && (
                <div className="absolute right-3 top-3">
                  <Badge variant="primary" className="text-[10px]">
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-current" /> Popular
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2"
                  style={{ backgroundColor: svc.bgColor }}
                >
                  <Icon className="h-5 w-5" style={{ color: svc.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-primary-c">{svc.title}</h4>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-ink-800 dark:text-emerald-400">
                      {svc.price}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-secondary-c line-clamp-2">{svc.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-muted-c">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {svc.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STEP 2: DATE & TIME ──────────────────────────────────────

function DateTimeStep({
  form,
  setForm,
}: {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}) {
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dates.push({ iso, label });
    }
    return dates;
  }, []);

  const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-primary-c">Select date & time</h3>
        <p className="text-xs text-secondary-c">Choose a date and available time slot.</p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-secondary-c flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Date
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dateOptions.map((d) => (
            <button
              key={d.iso}
              onClick={() => setForm((p) => ({ ...p, date: d.iso }))}
              className={cx(
                'rounded-xl border p-2.5 text-center text-xs font-semibold transition-all',
                form.date === d.iso
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-base-c bg-subtle-c text-secondary-c hover:border-emerald-500/40',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-secondary-c flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-emerald-600" /> Preferred Slot
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {timeSlots.map((ts) => (
            <button
              key={ts}
              onClick={() => setForm((p) => ({ ...p, time: ts }))}
              className={cx(
                'rounded-xl border py-2 text-center text-xs font-semibold transition-all',
                form.time === ts
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-base-c bg-subtle-c text-secondary-c hover:border-emerald-500/40',
              )}
            >
              {ts}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STEP 3: DETAILS ──────────────────────────────────────────

function DetailsStep({
  form,
  setForm,
}: {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-primary-c">Your Information</h3>
        <p className="text-xs text-secondary-c">Enter contact details for booking confirmation.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary-c">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="John Doe"
            className="form-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary-c">Phone / WhatsApp Number *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="form-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary-c">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com"
            className="form-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary-c">Company / Business Name</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            placeholder="Acme Corp"
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-c">Special Requirements / Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
          placeholder="Any specific questions or topics you'd like to discuss during the visit..."
          className="form-input resize-none"
        />
      </div>
    </div>
  );
}

// ── STEP 4: CONFIRMATION ─────────────────────────────────────

function ConfirmStep({
  form,
  service,
  onReset,
  onBackToList,
}: {
  form: BookingFormData;
  service: BookingService | null;
  onReset: () => void;
  onBackToList: () => void;
}) {
  const Icon = service?.icon ? SERVICE_ICONS[service.icon] ?? MapPin : MapPin;

  return (
    <div className="space-y-5 text-center">
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-500/10">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-success-500 shadow-lg shadow-success-500/30">
          <PartyPopper className="h-6 w-6 text-white" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-primary-c">Booking Created Successfully!</h3>
        <p className="mt-1 text-xs text-secondary-c">
          The booking request for {form.name} ({form.phone}) has been saved and added to your CRM dashboard.
        </p>
      </div>

      <div className="rounded-xl2 border border-base-c bg-subtle-c p-4 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Icon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary-c">{service?.title || 'Site Visit'}</h4>
            <p className="text-xs text-secondary-c">Slot: {form.date} ({form.time})</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onReset}
          className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c"
        >
          Book Another
        </button>
        <button
          onClick={onBackToList}
          className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
        >
          View Bookings List
        </button>
      </div>
    </div>
  );
}

export function BookingDetailModal({
  booking,
  onClose,
  onComplete,
  onCancel,
}: {
  booking: BookingDto;
  onClose: () => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const name = booking.contactName || booking.collectedData?.name || booking.contactWaId || 'Customer';
  const phone = booking.collectedData?.phone || booking.contactWaId || 'N/A';
  const email = booking.collectedData?.email || 'N/A';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-base-c bg-card-c p-6 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between border-b border-base-c pb-4">
          <div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              CUSTOMER BOOKING
            </span>
            <h3 className="mt-1.5 text-lg font-bold text-primary-c">{booking.service || 'Service Booking'}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 text-sm pr-1 scrollbar-thin">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Customer Name</span>
            <span className="font-semibold text-primary-c">{name}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
              <span className="text-xs text-muted-c">Phone</span>
              <p className="font-semibold text-primary-c mt-0.5">{phone}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
              <span className="text-xs text-muted-c">Email</span>
              <p className="font-semibold text-primary-c mt-0.5">{email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Preferred Time Slot</span>
            <span className="font-medium text-primary-c">{extractSlotFromBooking(booking)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Channel / Source</span>
            <span className="font-medium text-primary-c">{booking.source || 'WhatsApp Ingress'}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Booking Status</span>
            <span className="font-bold text-primary-c">{booking.status || 'CONFIRMED'}</span>
          </div>

          {booking.collectedData && Object.keys(booking.collectedData).length > 0 && (
            <div className="rounded-xl border border-base-c bg-slate-50 p-3.5 dark:bg-ink-850 space-y-2">
              <span className="text-xs font-bold text-primary-c">Chatbot / Form Collected Answers</span>
              <div className="space-y-2 pt-1 border-t border-base-c/60">
                {Object.entries(booking.collectedData).map(([key, val]) => (
                  <div key={key} className="flex flex-col text-xs">
                    <span className="font-semibold text-secondary-c">{key}</span>
                    <span className="text-primary-c font-medium mt-0.5">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-base-c pt-4">
          {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
            <>
              <button
                onClick={() => {
                  onCancel(booking.id);
                  onClose();
                }}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
              >
                Cancel Booking
              </button>
              <button
                onClick={() => {
                  onComplete(booking.id);
                  onClose();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 hover:scale-105"
              >
                Complete Booking
              </button>
            </>
          )}
          <button onClick={onClose} className="rounded-xl border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
