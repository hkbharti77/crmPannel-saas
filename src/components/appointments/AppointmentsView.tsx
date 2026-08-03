import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { TYPE_CONFIG, type Appointment } from './appointmentData';
import { AppointmentStats } from './AppointmentStats';
import { CalendarGrid } from './CalendarGrid';
import { AppointmentList, BookingModal } from './AppointmentList';
import {
  fetchAppointments,
  bookAppointment,
  type AppointmentDto,
} from '@/lib/appointmentsApi';
import { Plus, RefreshCw } from 'lucide-react';

import { formatLocalDateStr, getTodayDateStr, parseDateStr } from '@/lib/dateUtils';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    getTodayDateStr(),
  );
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState(
    getTodayDateStr(),
  );
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data } = await fetchAppointments();
    setLoading(false);

    if (data && data.length > 0) {
      const converted: Appointment[] = data.map((dto: AppointmentDto, idx: number) => {
        const dateStr = parseDateStr(dto.appointmentDateTime);
        const dt = dto.appointmentDateTime ? new Date(dto.appointmentDateTime) : new Date();
        const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: dto.id || `ap-${idx}`,
          title: dto.title || 'Scheduled Appointment',
          contactName: dto.contactName || dto.contactWaId || 'Contact',
          contactWaId: dto.contactWaId,
          company: dto.source || 'Direct Inquiry',
          date: dateStr,
          time: timeStr,
          type: (dto.source?.toLowerCase().includes('call') ? 'call' : 'site_visit') as any,
          status: (dto.status === 'COMPLETED' ? 'COMPLETED' : dto.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED') as any,
          assignedTo: dto.ownerName || 'Agent',
          location: dto.meetingLink || 'Office / Online',
          collectedData: dto.collectedData,
        };
      });
      setAppointments(converted);
    } else {
      setAppointments([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMonthChange = (delta: number) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  const handleBook = (date: string) => {
    setBookingDate(date);
    setShowBooking(true);
  };

  const handleSaveBooking = async (appt: Omit<Appointment, 'id'>) => {
    const timeVal = appt.time || appt.startTime || '10:00';
    const formattedTime = timeVal.includes(':') ? timeVal : '10:00';
    const dateTimeIso = `${appt.date}T${formattedTime.padStart(5, '0')}:00`;

    const res = await bookAppointment({
      title: appt.title,
      appointmentDateTime: dateTimeIso,
      source: appt.company,
    });

    if (res.data) {
      await loadData();
    } else {
      setAppointments((prev) => [
        ...prev,
        { ...appt, id: `ap${prev.length + 1}` },
      ]);
    }

    setShowBooking(false);
    setSelectedDate(appt.date);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Appointments</h2>
          <p className="mt-0.5 text-sm text-secondary-c">
            Schedule and manage site visits, calls, demos, and meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
            title="Refresh Appointments"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => handleBook(getTodayDateStr())}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            <Plus className="h-3.5 w-3.5" /> New Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <AppointmentStats appointments={appointments} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {TYPE_CONFIG.map((t) => (
          <span key={t.type} className="flex items-center gap-1.5 text-xs text-secondary-c">
            <span className={cx('h-2.5 w-2.5 rounded-full', t.dot)} />
            {t.label}
          </span>
        ))}
      </div>

      {/* Calendar + sidebar */}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <CalendarGrid
          appointments={appointments}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onBook={handleBook}
        />
        <AppointmentList
          appointments={appointments}
          selectedDate={selectedDate}
          onBook={handleBook}
        />
      </div>

      {/* Booking modal */}
      {showBooking && (
        <BookingModal
          date={bookingDate}
          onClose={() => setShowBooking(false)}
          onSave={handleSaveBooking}
        />
      )}
    </div>
  );
}
