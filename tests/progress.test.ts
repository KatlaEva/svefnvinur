import { describe, expect, it } from 'vitest';
import { averages, insight, loggedDayCount, summarizeDays } from '../src/lib/progress';
import { addDays } from '../src/lib/time';
import type { SleepLog } from '../src/data/types';
import { DAY, log, t } from './helpers';

function nightWith(day: string, wakings: number): SleepLog[] {
  const next = addDays(day, 1);
  const out = [log('night', t('19:00', day), t('07:00', next)), log('nap', t('12:00', day), t('13:30', day))];
  for (let i = 0; i < wakings; i++) out.push(log('waking', t(`0${1 + i}:00`, next), t(`0${1 + i}:10`, next)));
  return out;
}

describe('progress', () => {
  it('summarises nights, naps and wakings per plan day', () => {
    const logs = nightWith(DAY, 2);
    const [d] = summarizeDays(logs, 'c1', DAY, 1);
    expect(d.wakings).toBe(2);
    expect(d.nightMinutes).toBe(12 * 60 - 20);
    expect(d.napMinutes).toBe(90);
    expect(d.totalMinutes).toBe(12 * 60 - 20 + 90);
  });

  it('ignores other children and running timers', () => {
    const logs = [...nightWith(DAY, 1), log('nap', t('15:00'), null), log('nap', t('15:00'), t('16:00'), 'other')];
    const [d] = summarizeDays(logs, 'c1', DAY, 1);
    expect(d.napCount).toBe(1);
  });

  it('counts logged days and averages clock times across midnight', () => {
    const logs = [
      log('night', t('23:30', '2026-10-24'), t('07:00', '2026-10-25')),
      log('night', t('00:30', '2026-10-26'), t('07:00', '2026-10-26')),
    ];
    const days = summarizeDays(logs, 'c1', DAY, 7);
    expect(days).toHaveLength(7);
    expect(loggedDayCount(days)).toBe(2);
    expect(averages(days).asleep).toBe(0); // 00:00
    expect(averages(days).wake).toBe(7 * 60);
  });

  it('reports fewer wakings as the top insight', () => {
    const logs: SleepLog[] = [];
    const counts = [3, 3, 3, 2, 1, 1, 1];
    counts.forEach((w, i) => logs.push(...nightWith(addDays(DAY, i - 6), w)));
    const days = summarizeDays(logs, 'c1', DAY, 7);
    const ins = insight(days, [11, 14]);
    expect(ins).toEqual({ kind: 'wakingsDown', from: 3, to: 1 });
  });

  it('falls back to an average insight', () => {
    const logs = [...nightWith(DAY, 1)];
    const ins = insight(summarizeDays(logs, 'c1', DAY, 7), [11, 14]);
    expect(ins?.kind).toBe('average');
  });

  it('returns null with no nights', () => {
    expect(insight(summarizeDays([], 'c1', DAY, 7))).toBeNull();
  });
});
