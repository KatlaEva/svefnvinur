import { describe, expect, it } from 'vitest';
import { ageBandFor, computeAge, formatAge, scheduleFor, validateBirthDate } from '../src/lib/age';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10).getTime();

describe('computeAge', () => {
  it('counts whole months', () => {
    expect(computeAge('2025-08-26', at(2026, 10, 26)).months).toBe(14);
    expect(computeAge('2025-08-27', at(2026, 10, 26)).months).toBe(13);
  });

  it('handles newborns in days and weeks', () => {
    const a = computeAge('2026-10-23', at(2026, 10, 26));
    expect(a.days).toBe(3);
    expect(formatAge(a)).toBe('3 daga');
    expect(formatAge(computeAge('2026-10-05', at(2026, 10, 26)))).toBe('3 vikna');
  });

  it('uses corrected age for premature babies under 24 months', () => {
    const a = computeAge('2026-06-26', at(2026, 10, 26), true, 8);
    expect(a.corrected).toBe(true);
    expect(a.months).toBe(2);
    expect(computeAge('2026-06-26', at(2026, 10, 26), false, 8).months).toBe(4);
  });

  it('stops correcting after 24 months', () => {
    const a = computeAge('2024-06-01', at(2026, 10, 26), true, 10);
    expect(a.corrected).toBe(false);
    expect(a.years).toBe(2);
    expect(formatAge(a)).toBe('2 ára');
  });

  it('never goes negative before the due date', () => {
    const a = computeAge('2026-10-20', at(2026, 10, 26), true, 10);
    expect(a.months).toBe(0);
    expect(a.days).toBe(0);
  });

  it('formats singulars in Icelandic', () => {
    expect(formatAge(computeAge('2026-09-20', at(2026, 10, 26)))).toBe('1 mánaðar');
    expect(formatAge(computeAge('2025-08-26', at(2026, 10, 26)))).toBe('14 mánaða');
  });
});

describe('bands and schedules', () => {
  it('maps months to age bands', () => {
    expect(ageBandFor(0)).toBe('0-3m');
    expect(ageBandFor(5)).toBe('4-6m');
    expect(ageBandFor(11)).toBe('7-12m');
    expect(ageBandFor(14)).toBe('1-2y');
    expect(ageBandFor(30)).toBe('2-4y');
    expect(ageBandFor(100)).toBe('4y+');
  });

  it('has no naps from 4 years', () => {
    expect(scheduleFor(47).naps).toBe(1);
    expect(scheduleFor(48).naps).toBe(0);
    expect(scheduleFor(144).naps).toBe(0);
  });

  it('validates birth dates', () => {
    const now = at(2026, 10, 26);
    expect(validateBirthDate('', now)).toBe('missing');
    expect(validateBirthDate('2027-01-01', now)).toBe('future');
    expect(validateBirthDate('2010-01-01', now)).toBe('tooOld');
    expect(validateBirthDate('2020-01-01', now)).toBeNull();
  });
});
