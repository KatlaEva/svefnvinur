export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
/** A "plan day" runs from 04:00 to 04:00 so a night belongs to the evening it started. */
export const DAY_START_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Plan day that contains this moment (before 04:00 counts as the previous day). */
export function planDayKey(ms: number): string {
  const d = new Date(ms);
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export function planDayStart(key: string): number {
  const d = parseDateKey(key);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  return d.getTime();
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** "07:30" on the calendar date of the plan day. */
export function atClock(key: string, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseDateKey(key);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function clockToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function roundToMinute(ms: number): number {
  return Math.floor(ms / MIN) * MIN;
}

/** Minutes after noon, so evening/night clock times can be averaged across midnight. */
export function minutesFromNoon(ms: number): number {
  const d = new Date(ms);
  const m = d.getHours() * 60 + d.getMinutes() - 720;
  return m < 0 ? m + 1440 : m;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
