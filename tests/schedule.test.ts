import { describe, expect, it } from 'vitest';
import { buildDayPlan, isNightTime } from '../src/lib/schedule';
import { fmtTime } from '../src/lib/time';
import { bigKid, DAY, log, oneNapper, t, toddler } from './helpers';

const naps = (p: ReturnType<typeof buildDayPlan>) => p.items.filter((i) => i.kind === 'nap');

describe('buildDayPlan', () => {
  it('plans two naps and a bedtime in range for a 14-month-old', () => {
    const p = buildDayPlan(toddler, [], [], DAY, t('08:00'));
    expect(p.band).toBe('1-2y');
    expect(naps(p)).toHaveLength(2);
    expect(fmtTime(naps(p)[0].start)).toBe('10:15'); // 07:00 + 3h15
    expect(p.bedtime).toBeGreaterThanOrEqual(t('18:30'));
    expect(p.bedtime).toBeLessThanOrEqual(t('19:30'));
    expect(p.routineStart).toBe(p.bedtime - 30 * 60_000);
  });

  it('uses the logged morning wake-up', () => {
    const night = log('night', t('19:00', '2026-10-25'), t('06:00'));
    const p = buildDayPlan(toddler, [night], [], DAY, t('06:30'));
    expect(p.wakeLogged).toBe(true);
    expect(fmtTime(naps(p)[0].start)).toBe('09:15');
  });

  it('follows logged naps and plans the rest after them', () => {
    const nap = log('nap', t('10:00'), t('11:15'));
    const p = buildDayPlan(toddler, [nap], [], DAY, t('12:00'));
    expect(naps(p)[0].status).toBe('done');
    expect(naps(p)[1].status).toBe('planned');
    expect(naps(p)[1].start).toBe(t('11:15') + (195 + 75 / 2) * 60_000);
  });

  it('moves bedtime earlier after a short nap', () => {
    const normal = buildDayPlan(oneNapper, [log('nap', t('12:00'), t('14:00'), 'c2')], [], DAY, t('15:00'));
    const short = buildDayPlan(oneNapper, [log('nap', t('12:00'), t('12:30'), 'c2')], [], DAY, t('15:00'));
    expect(short.bedtime).toBeLessThan(normal.bedtime);
    expect(short.bedtimeShift).toBeGreaterThan(0);
  });

  it('moves bedtime earlier and marks the nap after a missed nap report', () => {
    const base = buildDayPlan(oneNapper, [], [], DAY, t('13:00'));
    const missed = buildDayPlan(
      oneNapper,
      [],
      [{ id: 'a', childId: 'c2', day: DAY, kind: 'missedNap', at: t('13:00') }],
      DAY,
      t('13:00'),
    );
    expect(naps(missed)[0].status).toBe('missed');
    expect(naps(missed).filter((n) => n.status === 'planned')).toHaveLength(0);
    expect(missed.bedtime).toBeLessThan(base.bedtime);
    expect(missed.bedtime).toBeGreaterThanOrEqual(t('17:45'));
  });

  it('has no naps from 4 years, only a bedtime', () => {
    const p = buildDayPlan(bigKid, [], [], DAY, t('12:00'));
    expect(p.hasNaps).toBe(false);
    expect(naps(p)).toHaveLength(0);
    expect(fmtTime(p.bedtime)).toBe('19:30');
  });

  it('uses the logged night start as bedtime', () => {
    const night = log('night', t('19:10'), null);
    const p = buildDayPlan(toddler, [night], [], DAY, t('20:00'));
    expect(p.bedtime).toBe(t('19:10'));
    expect(p.items.at(-1)?.status).toBe('ongoing');
  });

  it('is night from 30 min before bedtime until wake-up', () => {
    const p = buildDayPlan(toddler, [], [], DAY, t('12:00'));
    expect(isNightTime(p, t('12:00'))).toBe(false);
    expect(isNightTime(p, p.bedtime - 29 * 60_000)).toBe(true);
    expect(isNightTime(p, t('05:30'))).toBe(true);
  });
});
