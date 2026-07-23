import { useState, useMemo } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  SERVICES,
  AGENTS,
  generateTimeSlots,
  generateDateOptions,
  type BookingService,
  type BookingFormData,
} from './bookingData';
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
  Star,
  Video,
} from 'lucide-react';

const SERVICE_ICONS: Record<string, typeof MapPin> = {
  MapPin,
  MonitorPlay,
  Phone,
  Users,
};

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Service', 'Date & Time', 'Details', 'Confirm'];

export function BookingView() {
  const [step, setStep] = useState<Step>(1);
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

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.id === form.serviceId) ?? null,
    [form.serviceId],
  );

  const canProceed = () => {
    if (step === 1) return !!form.serviceId;
    if (step === 2) return !!form.date && !!form.time;
    if (step === 3) return form.name.trim().length > 0 && form.phone.trim().length > 0;
    return true;
  };

  const next = () => {
    if (canProceed() && step < 4) setStep((step + 1) as Step);
  };
  const prev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const reset = () => {
    setStep(1);
    setForm({ serviceId: '', date: '', time: '', name: '', phone: '', email: '', company: '', notes: '' });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl2 bg-gradient-accent shadow-glow-blue">
          <CalendarCheck className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Book an Appointment</h2>
        <p className="mt-1 text-sm text-secondary-c">
          Schedule a site visit, demo, or consultation in under a minute.
        </p>
      </div>

      {/* Stepper */}
      <StepIndicator current={step} />

      {/* Step content */}
      <GlassCard className="p-5 lg:p-6">
        {step === 1 && <ServiceStep form={form} setForm={setForm} />}
        {step === 2 && <DateTimeStep form={form} setForm={setForm} service={selectedService} />}
        {step === 3 && <DetailsStep form={form} setForm={setForm} />}
        {step === 4 && <ConfirmStep form={form} service={selectedService} onReset={reset} />}
      </GlassCard>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 1}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              step === 1
                ? 'cursor-not-allowed text-muted-c/40'
                : 'border border-base-c text-secondary-c hover:text-primary-c',
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canProceed()}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all',
              canProceed()
                ? 'bg-gradient-accent text-white hover:scale-105 shadow-soft'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            {step === 3 ? 'Review Booking' : 'Continue'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Stepper ─── */
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const isComplete = stepNum < current;
        const isCurrent = stepNum === current;
        return (
          <div key={label} className="flex items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cx(
                  'grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all',
                  isComplete
                    ? 'bg-success-500 text-white'
                    : isCurrent
                      ? 'bg-gradient-accent text-white ring-4 ring-primary-500/15'
                      : 'border-2 border-base-c bg-card-c text-muted-c',
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cx(
                  'mt-1.5 hidden text-[10px] font-semibold sm:block',
                  isCurrent ? 'text-primary-c' : isComplete ? 'text-success-600 dark:text-success-400' : 'text-muted-c',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="mx-2 h-0.5 w-8 rounded-full sm:w-12">
                <div className={cx('h-full rounded-full transition-colors', isComplete ? 'bg-success-500' : 'bg-base-c')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Service ─── */
function ServiceStep({
  form,
  setForm,
}: {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-primary-c">Choose a service</h3>
        <p className="mt-0.5 text-sm text-secondary-c">Select what you'd like to schedule.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((svc) => {
          const Icon = SERVICE_ICONS[svc.icon] ?? MapPin;
          const selected = form.serviceId === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => setForm((f) => ({ ...f, serviceId: svc.id }))}
              className={cx(
                'group relative flex flex-col items-start rounded-xl2 border-2 p-4 text-left transition-all',
                selected
                  ? 'border-primary-500 bg-primary-500/5 shadow-soft'
                  : 'border-base-c hover:border-primary-500/30 hover:shadow-soft',
              )}
            >
              {svc.popular && (
                <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-gradient-accent px-2 py-0.5 text-[9px] font-bold text-white">
                  <Star className="h-2.5 w-2.5" /> POPULAR
                </span>
              )}
              <div
                className="mb-3 grid h-11 w-11 place-items-center rounded-xl2"
                style={{ backgroundColor: svc.bgColor }}
              >
                <Icon className="h-5.5 w-5.5" style={{ color: svc.color }} />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-primary-c">{svc.title}</h4>
                {svc.price && (
                  <span className={cx(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    svc.price === 'Free' ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
                  )}>
                    {svc.price}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-secondary-c">{svc.description}</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-c">
                <Clock className="h-3.5 w-3.5" /> {svc.duration}
              </div>
              {selected && (
                <div className="absolute right-3 bottom-3 grid h-5 w-5 place-items-center rounded-full bg-primary-500 text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: Date & Time ─── */
function DateTimeStep({
  form,
  setForm,
  service,
}: {
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
  service: BookingService | null;
}) {
  const dates = useMemo(() => generateDateOptions(14), []);
  const slots = useMemo(() => (form.date ? generateTimeSlots(form.date) : []), [form.date]);

  const morningSlots = slots.filter((s) => parseInt(s.time) < 12);
  const afternoonSlots = slots.filter((s) => parseInt(s.time) >= 12 && parseInt(s.time) < 17);
  const eveningSlots = slots.filter((s) => parseInt(s.time) >= 17);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-primary-c">Pick a date & time</h3>
        <p className="mt-0.5 text-sm text-secondary-c">
          {service ? `${service.title} · ${service.duration}` : 'Select a slot'}
        </p>
      </div>

      {/* Date selector */}
      <div>
        <label className="mb-2 block text-xs font-medium text-secondary-c">Select date</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {dates.map((d) => {
            const selected = form.date === d.date;
            return (
              <button
                key={d.date}
                onClick={() => setForm((f) => ({ ...f, date: d.date, time: '' }))}
                className={cx(
                  'flex min-w-[64px] shrink-0 flex-col items-center rounded-xl2 border-2 px-3 py-2.5 transition-all',
                  selected
                    ? 'border-primary-500 bg-primary-500/5 shadow-soft'
                    : 'border-base-c hover:border-primary-500/30',
                )}
              >
                <span className={cx('text-[10px] font-semibold uppercase', selected ? 'text-primary-600 dark:text-primary-400' : 'text-muted-c')}>
                  {d.weekday}
                </span>
                <span className={cx('mt-1 text-lg font-bold', selected ? 'text-primary-c' : 'text-secondary-c')}>
                  {d.dayNum}
                </span>
                <span className={cx('text-[10px]', selected ? 'text-primary-600 dark:text-primary-400' : 'text-muted-c')}>
                  {d.label === `Today` || d.label === 'Tomorrow' ? d.label : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {form.date ? (
        <div>
          <label className="mb-2 block text-xs font-medium text-secondary-c">Select time</label>
          {slots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-c">No slots available</p>
          ) : (
            <div className="space-y-4">
              {morningSlots.length > 0 && (
                <SlotGroup label="Morning" icon={Calendar} slots={morningSlots} form={form} setForm={setForm} />
              )}
              {afternoonSlots.length > 0 && (
                <SlotGroup label="Afternoon" icon={Calendar} slots={afternoonSlots} form={form} setForm={setForm} />
              )}
              {eveningSlots.length > 0 && (
                <SlotGroup label="Evening" icon={Calendar} slots={eveningSlots} form={form} setForm={setForm} />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-10 w-10 text-muted-c/30" />
          <p className="mt-2 text-sm text-muted-c">Please select a date first</p>
        </div>
      )}
    </div>
  );
}

function SlotGroup({
  label,
  slots,
  form,
  setForm,
}: {
  label: string;
  icon: typeof Calendar;
  slots: { time: string; available: boolean }[];
  form: BookingFormData;
  setForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-c">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((slot) => {
          const selected = form.time === slot.time;
          return (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => setForm((f) => ({ ...f, time: slot.time }))}
              className={cx(
                'rounded-lg border py-2 text-xs font-medium transition-all',
                !slot.available
                  ? 'cursor-not-allowed border-base-c bg-subtle-c text-muted-c/40 line-through'
                  : selected
                    ? 'border-primary-500 bg-primary-500/10 text-primary-700 shadow-soft dark:text-primary-300'
                    : 'border-base-c text-secondary-c hover:border-primary-500/40 hover:text-primary-c',
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 3: Details ─── */
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
        <h3 className="text-base font-semibold text-primary-c">Your details</h3>
        <p className="mt-0.5 text-sm text-secondary-c">We'll use this to confirm your booking.</p>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <FormField label="Full Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Rajesh Mehta"
            className="form-input"
          />
        </FormField>
        <FormField label="Phone" required>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="form-input"
          />
        </FormField>
        <FormField label="Email">
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="rajesh@email.com"
            className="form-input"
          />
        </FormField>
        <FormField label="Company">
          <input
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Metro Realty"
            className="form-input"
          />
        </FormField>
      </div>
      <FormField label="Notes (optional)">
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          placeholder="Any specific requirements or questions…"
          className="form-input resize-none"
        />
      </FormField>

      {/* Assigned agent */}
      <div>
        <label className="mb-2 block text-xs font-medium text-secondary-c">Preferred Agent</label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex min-w-[120px] shrink-0 items-center gap-2 rounded-lg border border-base-c bg-card-c p-2"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-accent text-[10px] font-bold text-white">
                {agent.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-primary-c">{agent.name}</p>
                <p className="flex items-center gap-0.5 text-[9px] text-muted-c">
                  <Star className="h-2.5 w-2.5 text-warning-500" /> {agent.rating}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-secondary-c">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Step 4: Confirm ─── */
function ConfirmStep({
  form,
  service,
  onReset,
}: {
  form: BookingFormData;
  service: BookingService | null;
  onReset: () => void;
}) {
  const dateLabel = formatDate(form.date);
  const Icon = service ? SERVICE_ICONS[service.icon] ?? MapPin : MapPin;

  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success-500/15">
            <PartyPopper className="h-8 w-8 text-success-600 dark:text-success-400" />
          </div>
          <span className="absolute -inset-2 animate-ping rounded-full bg-success-500/20" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-primary-c">Booking Confirmed!</h3>
        <p className="mt-1 max-w-xs text-sm text-secondary-c">
          We've sent a confirmation to {form.phone}. A reminder will be sent before your appointment.
        </p>
      </div>

      {/* Booking summary */}
      <div className="rounded-xl2 border border-base-c bg-subtle-c p-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl2"
            style={{ backgroundColor: service?.bgColor ?? 'rgba(37,99,235,0.10)' }}
          >
            <Icon className="h-6 w-6" style={{ color: service?.color ?? '#2563EB' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-primary-c">{service?.title}</h4>
            <p className="text-xs text-secondary-c">{service?.description}</p>
          </div>
        </div>

        <div className="my-4 h-px bg-border-base" />

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryRow icon={Calendar} label="Date" value={dateLabel} />
          <SummaryRow icon={Clock} label="Time" value={`${form.time} (${service?.duration})`} />
          <SummaryRow icon={Users} label="Name" value={form.name} />
          <SummaryRow icon={Phone} label="Phone" value={form.phone} />
          {form.email && <SummaryRow icon={MonitorPlay} label="Email" value={form.email} />}
          {form.company && <SummaryRow icon={Users} label="Company" value={form.company} />}
        </div>

        {form.notes && (
          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
            <p className="text-[10px] font-semibold text-muted-c">NOTES</p>
            <p className="mt-0.5 text-xs text-secondary-c">{form.notes}</p>
          </div>
        )}
      </div>

      {/* AI suggestion */}
      <div className="flex items-start gap-2.5 rounded-xl2 bg-gradient-accent-soft p-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600 dark:text-secondary-400" />
        <p className="text-xs text-secondary-c">
          <span className="font-semibold text-primary-c">AI Tip:</span> Leads who book site visits within 48 hours of initial contact are 3x more likely to convert. Consider scheduling a follow-up call right after this visit.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
        >
          <CalendarCheck className="h-3.5 w-3.5" /> Book Another
        </button>
        <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
          <Video className="h-3.5 w-3.5" /> Add to Calendar
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      <span className="text-[11px] text-muted-c">{label}</span>
      <span className="ml-auto truncate text-right text-xs font-medium text-primary-c">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
