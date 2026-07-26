/**
 * Local-calendar date helpers. Everything here works in `YYYY-MM-DD` strings interpreted
 * in the user's local time zone, so "today" matches what the user sees on their calendar
 * rather than a UTC instant.
 */

/** Format a Date as a local `YYYY-MM-DD` string. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today as a local `YYYY-MM-DD` string. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Shift a `YYYY-MM-DD` string by a number of days (may be negative), staying local. */
export function addDays(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day + delta));
}

/** True when the string is a well-formed `YYYY-MM-DD` calendar date. */
export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}
