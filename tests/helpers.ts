import type { Child, SleepLog } from '../src/data/types';

export const DAY = '2026-10-26';
export const t = (hhmm: string, day = DAY) => {
  const [y, m, d] = day.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
};

/** 14 months old on 2026-10-26 */
export const toddler: Child = {
  id: 'c1',
  name: 'Theódór',
  birthDate: '2025-08-20',
  premature: false,
  weeksEarly: 0,
  wakeTime: '07:00',
  goal: 'fewerWakings',
};

/** 20 months old: one nap */
export const oneNapper: Child = { ...toddler, id: 'c2', birthDate: '2025-02-10' };

/** 6 years old: no naps */
export const bigKid: Child = { ...toddler, id: 'c3', birthDate: '2020-05-01' };

let n = 0;
export const log = (type: SleepLog['type'], start: number, end: number | null, childId = 'c1'): SleepLog => ({
  id: `l${++n}`,
  childId,
  type,
  start,
  end,
});
