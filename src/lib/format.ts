import { is } from '../content/is';

/** "45 mín", "2 klst", "1 klst 20 mín". Never shows NaN or negative values. */
export function fmtDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(Number.isFinite(totalMinutes) ? totalMinutes : 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return is.duration.minutes(r);
  if (r === 0) return is.duration.hours(h);
  return `${is.duration.hours(h)} ${is.duration.minutes(r)}`;
}

/** Live timer "12:05" (mm:ss) or "1:12:05" (h:mm:ss). */
export function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** "mánudagur" */
export function fmtWeekday(ms: number): string {
  return is.weekdays[new Date(ms).getDay()];
}

/** "26. október" */
export function fmtDayMonth(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()}. ${is.months[d.getMonth()]}`;
}

/** "mánudagur 26. október" */
export function fmtDateLong(ms: number): string {
  return `${fmtWeekday(ms)} ${fmtDayMonth(ms)}`;
}

/** Icelandic decimal: 2,5 ; whole numbers stay whole. */
export function fmtNumber(n: number, decimals = 1): string {
  const r = Number(n.toFixed(decimals));
  return Number.isInteger(r) ? String(r) : r.toFixed(decimals).replace('.', ',');
}

/** Hours range "11–14 klst" */
export function fmtHoursRange([a, b]: [number, number]): string {
  return `${a}–${b} klst`;
}

/** Wake window range in friendly units: "45–75 mín", "2½–3 klst". */
export function fmtWindowRange([a, b]: [number, number]): string {
  if (b <= 90) return `${a}–${b} mín`;
  const h = (min: number) => {
    const whole = Math.floor(min / 60);
    const rest = min % 60;
    const frac = rest >= 50 ? 1 : rest >= 40 ? '¾' : rest >= 25 ? '½' : rest >= 10 ? '¼' : '';
    if (frac === 1) return String(whole + 1);
    return `${whole || ''}${frac}` || '0';
  };
  return `${h(a)}–${h(b)} klst`;
}
