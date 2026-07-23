import { useState } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { APPOINTMENTS, TYPE_CONFIG, type Appointment } from './appointmentData';
import { AppointmentStats } from './AppointmentStats';
import { CalendarGrid } from './CalendarGrid';
import { AppointmentList, BookingModal } from './AppointmentList';
import { CalendarDays, Plus, List as ListIcon } from 'lucide-react';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0],
  );
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split('T')[0],
  );

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

  const handleSaveBooking = (appt: Omit<Appointment, 'id'>) => {
    setAppointments((prev) => [
      ...prev,
      { ...appt, id: `ap${prev.length + 1}` },
    ]);
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
        <button
          onClick={() => handleBook(new Date().toISOString().split('T')[0])}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> New Appointment
        </button>
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
