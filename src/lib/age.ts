import { ageBands, schedules, type AgeBand, type ScheduleRow } from '../content/advice';
import { DAY, parseDateKey } from './time';

export interface Age {
  days: number;
  weeks: number;
  /** whole months */
  months: number;
  years: number;
  /** true when the age was corrected for prematurity */
  corrected: boolean;
}

/** Corrected age is used for premature babies until 24 months of actual age. */
export const CORRECT_UNTIL_MONTHS = 24;

function wholeMonths(from: Date, to: Date): number {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return Math.max(0, m);
}

export function computeAge(birthDate: string, now: number, premature = false, weeksEarly = 0): Age {
  const birth = parseDateKey(birthDate);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  birth.setHours(12, 0, 0, 0);
  const actualMonths = wholeMonths(birth, today);
  const corrected = premature && weeksEarly > 0 && actualMonths < CORRECT_UNTIL_MONTHS;
  const from = new Date(birth);
  if (corrected) from.setDate(from.getDate() + weeksEarly * 7);
  const days = Math.max(0, Math.round((today.getTime() - from.getTime()) / DAY));
  const months = from > today ? 0 : wholeMonths(from, today);
  return { days, weeks: Math.floor(days / 7), months, years: Math.floor(months / 12), corrected };
}

export function ageBandFor(months: number): AgeBand {
  const band = ageBands.find((b) => months >= b.fromMonths && months < b.toMonths);
  return band ? band.id : '4y+';
}

export function scheduleFor(months: number): ScheduleRow {
  return schedules.find((r) => months >= r.fromMonths && months < r.toMonths) ?? schedules[schedules.length - 1];
}

/** "3 daga", "5 vikna", "14 mánaða", "3 ára" */
export function formatAge(age: Age): string {
  if (age.days < 7) return age.days === 1 ? '1 dags' : `${age.days} daga`;
  if (age.months < 1) return age.weeks === 1 ? '1 viku' : `${age.weeks} vikna`;
  if (age.months < 24) return age.months === 1 ? '1 mánaðar' : `${age.months} mánaða`;
  return `${age.years} ára`;
}

/** Short pill text: "14 mán", "3 ára", "5 vikna" */
export function formatAgeShort(age: Age): string {
  if (age.months < 1) return formatAge(age);
  if (age.months < 24) return `${age.months} mán`;
  return `${age.years} ára`;
}

export const MAX_AGE_MONTHS = 12 * 12 + 11;

/** Validates a birth date for onboarding / child form. Returns an error key or null. */
export function validateBirthDate(birthDate: string, now: number): 'missing' | 'future' | 'tooOld' | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return 'missing';
  const birth = parseDateKey(birthDate);
  if (Number.isNaN(birth.getTime())) return 'missing';
  if (birth.getTime() > now) return 'future';
  if (computeAge(birthDate, now).months > MAX_AGE_MONTHS) return 'tooOld';
  return null;
}
