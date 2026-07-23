import { GlassCard } from '@/components/ui/primitives';
import { CalendarCheck, Clock, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import type { Appointment } from './appointmentData';

export function AppointmentStats({ appointments }: { appointments: Appointment[] }) {
  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length;
  const upcomingToday = appointments.filter((a) => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today && a.status === 'SCHEDULED';
  }).length;

  const stats = [
    { label: 'Today', value: String(upcomingToday), icon: CalendarDays, color: '#2563EB', bg: 'rgba(37,99,235,0.10)', sub: 'Appointments' },
    { label: 'Scheduled', value: String(scheduled), icon: CalendarCheck, color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', sub: 'Upcoming' },
    { label: 'Completed', value: String(completed), icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.10)', sub: 'This month' },
    { label: 'Missed', value: String(cancelled), icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.10)', sub: 'Cancelled + No-show' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <GlassCard key={s.label} className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2" style={{ backgroundColor: s.bg }}>
              <Icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs text-secondary-c">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-primary-c">{s.value}</p>
              <p className="text-[10px] text-muted-c">{s.sub}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
