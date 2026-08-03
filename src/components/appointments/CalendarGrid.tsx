import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Appointment } from './appointmentData';
import { TYPE_CONFIG } from './appointmentData';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getTodayDateStr, formatYearMonthDay } from '@/lib/dateUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarGrid({
  appointments,
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  onBook,
}: {
  appointments: Appointment[];
  currentMonth: Date;
  onMonthChange: (delta: number) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onBook: (date: string) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayStr = getTodayDateStr();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: string; day: number; isCurrent: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const date = formatYearMonthDay(year, month - 1, d);
    cells.push({ date, day: d, isCurrent: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = formatYearMonthDay(year, month, d);
    cells.push({ date, day: d, isCurrent: true });
  }
  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = formatYearMonthDay(year, month + 1, d);
    cells.push({ date, day: d, isCurrent: false });
  }

  const apptsByDate = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    (acc[a.date] ??= []).push(a);
    return acc;
  }, {});

  return (
    <GlassCard className="overflow-hidden p-4 lg:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-primary-c">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMonthChange(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c transition-colors hover:border-primary-500/30 hover:text-primary-c"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c transition-colors hover:border-primary-500/30 hover:text-primary-c"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-c">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const { date, day, isCurrent } = cell;
          const cellAppts = apptsByDate[date] ?? [];
          const isToday = date === todayStr;
          const isSelected = date === selectedDate;
          const hasAppts = cellAppts.length > 0;

          return (
            <div
              key={i}
              onClick={() => onSelectDate(date)}
              className={cx(
                'group relative min-h-[72px] cursor-pointer rounded-xl2 border p-1.5 transition-all sm:min-h-[88px]',
                isCurrent ? 'border-base-c bg-card-c' : 'border-transparent bg-subtle-c/50 opacity-50',
                isSelected && 'border-primary-500/50 ring-2 ring-primary-500/20',
                !isSelected && isCurrent && 'hover:border-primary-500/30 hover:shadow-soft',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cx(
                    'grid h-6 w-6 place-items-center rounded-full text-xs font-semibold transition-colors',
                    isToday
                      ? 'bg-gradient-accent text-white'
                      : isCurrent
                        ? 'text-primary-c'
                        : 'text-muted-c',
                  )}
                >
                  {day}
                </span>
                {isCurrent && hasAppts && (
                  <span className="hidden text-[9px] font-bold text-muted-c sm:inline">
                    {cellAppts.length}
                  </span>
                )}
              </div>

              {/* Appointment dots / pills */}
              {hasAppts && (
                <div className="mt-1 space-y-0.5">
                  {cellAppts.slice(0, 2).map((a) => {
                    const cfg = TYPE_CONFIG.find((t) => t.type === a.type)!;
                    return (
                      <div
                        key={a.id}
                        className={cx(
                          'flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-medium leading-tight',
                          cfg.bg,
                          cfg.color,
                          'truncate',
                        )}
                      >
                        <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
                        <span className="hidden sm:inline truncate">{a.startTime}</span>
                      </div>
                    );
                  })}
                  {cellAppts.length > 2 && (
                    <p className="px-1 text-[9px] font-medium text-muted-c">
                      +{cellAppts.length - 2} more
                    </p>
                  )}
                </div>
              )}

              {/* Quick add button on hover */}
              {isCurrent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBook(date);
                  }}
                  className="absolute right-1 bottom-1 grid h-5 w-5 place-items-center rounded-full border border-base-c bg-card-c text-muted-c opacity-0 transition-all hover:border-primary-500/40 hover:text-primary-c group-hover:opacity-100"
                  aria-label="Book appointment"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
