export function formatLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatYearMonthDay(year: number, monthZeroBased: number, day: number): string {
  const d = new Date(year, monthZeroBased, day);
  return formatLocalDateStr(d);
}

export function getTodayDateStr(): string {
  return formatLocalDateStr(new Date());
}

/**
 * Safely extracts the local date string (YYYY-MM-DD) from an ISO datetime or date string
 * without timezone shift distortion.
 */
export function parseDateStr(raw?: string): string {
  if (!raw || typeof raw !== 'string') return getTodayDateStr();

  // If raw string starts with YYYY-MM-DD (e.g. "2026-09-19T10:00:00" or "2026-09-19 10:00:00" or "2026-09-19")
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const d = new Date(raw);
  if (isNaN(d.getTime())) return getTodayDateStr();
  return formatLocalDateStr(d);
}
