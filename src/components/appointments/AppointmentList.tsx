import { useState } from 'react';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Appointment } from './appointmentData';
import { TYPE_CONFIG, STATUS_CONFIG } from './appointmentData';
import {
  Clock,
  MapPin,
  UserCheck,
  Phone,
  MapPinned,
  MonitorPlay,
  Users,
  Plus,
  X,
  CalendarPlus,
  Video,
  ChevronRight,
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
}: {
  appointments: Appointment[];
  selectedDate: string | null;
  onBook: (date: string) => void;
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
              <AppointmentCard key={appt.id} appt={appt} />
            ))
        )}
      </div>
    </GlassCard>
  );
}

export function AppointmentCard({ appt }: { appt: Appointment }) {
  const cfg = TYPE_CONFIG.find((t) => t.type === appt.type)!;
  const statusCfg = STATUS_CONFIG[appt.status];
  const TypeIcon = TYPE_ICON_MAP[appt.type];

  return (
    <div
      className={cx(
        'group rounded-xl2 border p-3.5 transition-all hover:shadow-soft',
        appt.status === 'CANCELLED' || appt.status === 'NO_SHOW'
          ? 'border-base-c opacity-60'
          : 'border-base-c hover:border-primary-500/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl2', cfg.bg)}>
          <TypeIcon className={cx('h-5 w-5', cfg.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-primary-c">{appt.title}</p>
            <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', statusCfg.color)}>
              {statusCfg.label}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar name={appt.leadName} size={20} />
            <span className="truncate text-xs text-secondary-c">{appt.leadName}</span>
            <span className="text-[10px] text-muted-c">· {appt.leadCompany}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-c">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {appt.startTime}–{appt.endTime}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {appt.location}
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> {appt.assignedTo}
            </span>
          </div>
        </div>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
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
    </div>
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
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
