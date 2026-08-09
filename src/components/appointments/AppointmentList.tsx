import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Appointment } from './appointmentData';
import { TYPE_CONFIG, STATUS_CONFIG } from './appointmentData';
import { generateMeetLink, completeAppointment, cancelAppointment } from '@/lib/appointmentsApi';
import {
  Clock,
  UserCheck,
  Phone,
  MapPinned,
  MonitorPlay,
  Users,
  Plus,
  X,
  CalendarPlus,
  Video,
  Loader2,
  Copy,
} from 'lucide-react';

const TYPE_ICON_MAP: Record<Appointment['type'], typeof Phone> = {
  site_visit: MapPinned,
  call: Phone,
  demo: MonitorPlay,
  meeting: Users,
};

export function AppointmentList({
  appointments,
  selectedDate,
  onBook,
  onRefresh,
}: {
  appointments: Appointment[];
  selectedDate: string | null;
  onBook: (date: string) => void;
  onRefresh?: () => void;
}) {
  const dateLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : 'All Upcoming';

  const filtered = selectedDate
    ? appointments.filter((a) => a.date === selectedDate)
    : appointments.filter((a) => a.status === 'SCHEDULED').sort((a, b) => a.date.localeCompare(b.date));

  return (
    <GlassCard className="flex flex-col p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-primary-c">{dateLabel}</h3>
          <p className="text-xs text-muted-c">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => onBook(selectedDate ?? new Date().toISOString().split('T')[0])}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> Book
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarPlus className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">No appointments</p>
            <button
              onClick={() => onBook(selectedDate ?? new Date().toISOString().split('T')[0])}
              className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Book one now
            </button>
          </div>
        ) : (
          filtered
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            .map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} onRefresh={onRefresh} />
            ))
        )}
      </div>
    </GlassCard>
  );
}

export function AppointmentCard({ appt, onRefresh }: { appt: Appointment; onRefresh?: () => void }) {
  const cfg = TYPE_CONFIG.find((t) => t.type === appt.type) || TYPE_CONFIG[0];
  const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.SCHEDULED;
  const TypeIcon = TYPE_ICON_MAP[appt.type] || MapPinned;
  const [generating, setGenerating] = useState(false);
  const [meetLink, setMeetLink] = useState(appt.location?.startsWith('http') ? appt.location : '');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleGenerateMeet = async () => {
    setGenerating(true);
    setErrorMsg(null);
    const { meetLink: newLink, error } = await generateMeetLink(appt.id);
    setGenerating(false);
    if (newLink) {
      setMeetLink(newLink);
      if (onRefresh) onRefresh();
    } else {
      setErrorMsg(error || 'Failed to generate Meet link. Connect Google Calendar in Settings.');
    }
  };

  const handleCopy = () => {
    if (meetLink) {
      navigator.clipboard.writeText(meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={cx(
          'group rounded-xl2 border p-3.5 transition-all cursor-pointer hover:shadow-soft',
          appt.status === 'CANCELLED' || appt.status === 'NO_SHOW'
            ? 'border-base-c opacity-60'
            : 'border-base-c hover:border-primary-500/40',
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl2', cfg.bg)}>
            <TypeIcon className={cx('h-5 w-5', cfg.color)} />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold text-primary-c group-hover:text-primary-600 dark:group-hover:text-primary-400">{appt.title}</p>
              <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', statusCfg.color)}>
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Avatar name={appt.leadName || appt.contactName || 'Contact'} size={20} />
              <span className="truncate text-xs text-secondary-c">{appt.leadName || appt.contactName || 'Contact'}</span>
              <span className="text-[10px] text-muted-c">· {appt.leadCompany || appt.company || 'Direct'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-c">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {appt.startTime || appt.time || '10:00 AM'}{(appt.endTime ? `–${appt.endTime}` : '')}
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> {appt.assignedTo}
              </span>
            </div>

            {/* Google Meet Actions */}
            <div className="mt-2 pt-2 border-t border-base-c/60 flex flex-wrap items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              {meetLink ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Video className="h-3.5 w-3.5 text-emerald-600" /> Join Meet
                  </a>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary-c hover:text-primary-c"
                  >
                    <Copy className="h-3 w-3" /> {copied ? 'Copied! ✓' : 'Copy Link'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateMeet}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
                  Generate Meet Link & Send to WhatsApp
                </button>
              )}
              {errorMsg && <p className="text-[10px] text-rose-500">{errorMsg}</p>}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <AppointmentDetailModal appt={appt} onClose={() => setShowDetail(false)} onRefresh={onRefresh} />
      )}
    </>
  );
}

export function AppointmentDetailModal({
  appt,
  onClose,
  onRefresh,
}: {
  appt: Appointment;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (appt.location?.startsWith('http')) {
      navigator.clipboard.writeText(appt.location);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComplete = async () => {
    setUpdating(true);
    await completeAppointment(appt.id);
    setUpdating(false);
    onClose();
    if (onRefresh) onRefresh();
  };

  const handleCancel = async () => {
    setUpdating(true);
    await cancelAppointment(appt.id);
    setUpdating(false);
    onClose();
    if (onRefresh) onRefresh();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-base-c bg-card-c p-6 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between border-b border-base-c pb-4">
          <div>
            <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400">
              {appt.type ? appt.type.toUpperCase().replace('_', ' ') : 'APPOINTMENT'}
            </span>
            <h3 className="mt-1.5 text-lg font-bold text-primary-c">{appt.title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 text-sm pr-1 scrollbar-thin">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Customer Name</span>
            <span className="font-semibold text-primary-c">{appt.contactName || appt.leadName || 'Contact'}</span>
          </div>

          {appt.contactWaId && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
              <span className="text-xs text-muted-c">WhatsApp Number</span>
              <span className="font-semibold text-primary-c">{appt.contactWaId}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
              <span className="text-xs text-muted-c">Date</span>
              <p className="font-semibold text-primary-c mt-0.5">{appt.date}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
              <span className="text-xs text-muted-c">Time Slot</span>
              <p className="font-semibold text-primary-c mt-0.5">{appt.startTime || appt.time || '10:00 AM'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Assigned Agent</span>
            <span className="font-medium text-primary-c">{appt.assignedTo}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-ink-850">
            <span className="text-xs text-muted-c">Current Status</span>
            <span className="font-bold text-primary-c">{appt.status}</span>
          </div>

          {appt.location?.startsWith('http') && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Google Meet Link</span>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <a href={appt.location} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 underline truncate">
                  {appt.location}
                </a>
                <button onClick={handleCopy} className="shrink-0 text-xs font-bold text-emerald-700 hover:underline">
                  {copied ? 'Copied ✓' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {appt.collectedData && Object.keys(appt.collectedData).length > 0 && (
            <div className="rounded-xl border border-base-c bg-slate-50 p-3.5 dark:bg-ink-850 space-y-2">
              <span className="text-xs font-bold text-primary-c">Chatbot / Form Collected Answers</span>
              <div className="space-y-2 pt-1 border-t border-base-c/60">
                {Object.entries(appt.collectedData).map(([key, val]) => (
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
          {appt.status === 'SCHEDULED' && (
            <>
              <button onClick={handleCancel} disabled={updating} className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-500/20">
                Cancel Appointment
              </button>
              <button onClick={handleComplete} disabled={updating} className="rounded-xl bg-gradient-accent px-4 py-2 text-xs font-semibold text-white hover:scale-105">
                Mark as Completed
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

export function BookingModal({
  date,
  onClose,
  onSave,
}: {
  date: string;
  onClose: () => void;
  onSave: (appt: Omit<Appointment, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [leadName, setLeadName] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [type, setType] = useState<Appointment['type']>('site_visit');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('Priya Sharma');

  const handleSave = () => {
    if (!title.trim() || !leadName.trim()) return;
    onSave({
      title: title.trim(),
      leadName: leadName.trim(),
      leadCompany: '—',
      date,
      startTime,
      endTime,
      type,
      status: 'SCHEDULED',
      location: location.trim() || 'TBD',
      assignedTo,
    });
  };

  const typeOptions = TYPE_CONFIG.map((t) => ({ value: t.type, label: t.label }));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent">
              <CalendarPlus className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">New Appointment</h3>
              <p className="text-xs text-muted-c">{formatDateLabel(date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3.5">
          <Field label="Title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Site Visit — Skyline Residency"
              className="form-input"
            />
          </Field>

          <Field label="Lead / Client Name" required>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="e.g. Rajesh Mehta"
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="form-input" />
            </Field>
            <Field label="End Time">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="form-input" />
            </Field>
          </div>

          <Field label="Type">
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value as Appointment['type'])}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    type === t.value
                      ? 'bg-gradient-accent text-white shadow-soft'
                      : 'border border-base-c text-secondary-c hover:text-primary-c',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Skyline Residency, Andheri West"
              className="form-input"
            />
          </Field>

          <Field label="Assigned To">
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="form-input">
              <option>Priya Sharma</option>
              <option>Arjun Kapoor</option>
              <option>Sneha Patel</option>
              <option>Rahul Verma</option>
            </select>
          </Field>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !leadName.trim()}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              title.trim() && leadName.trim()
                ? 'bg-gradient-accent text-white hover:scale-105'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Book Appointment
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({
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

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return 'All Upcoming';
  const parts = dateStr.split('-');
  let d: Date;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
