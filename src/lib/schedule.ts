import { rules, type AgeBand, type ScheduleRow } from '../content/advice';
import type { Child, DayAdjustment, SleepLog } from '../data/types';
import { ageBandFor, computeAge, scheduleFor } from './age';
import { atClock, HOUR, MIN, planDayKey, planDayStart } from './time';

export interface PlanItem {
  kind: 'nap' | 'bedtime';
  start: number;
  end?: number;
  status: 'done' | 'ongoing' | 'planned' | 'missed';
  logId?: string;
}

export interface DayPlan {
  day: string;
  months: number;
  band: AgeBand;
  row: ScheduleRow;
  /** morning wake-up, logged or the usual time */
  wake: number;
  wakeLogged: boolean;
  items: PlanItem[];
  bedtime: number;
  routineStart: number;
  /** minutes bedtime moved earlier because of missed / short naps */
  bedtimeShift: number;
  hasNaps: boolean;
}

const avg = ([a, b]: [number, number]) => (a + b) / 2;

/** Wake window before nap i (0-based); i === naps is the window before bedtime. */
export function wakeWindow(row: ScheduleRow, i: number): number {
  const [min, max] = row.wakeWindow;
  if (row.naps === 0) return min;
  return min + ((max - min) * i) / row.naps;
}

export function buildDayPlan(
  child: Child,
  allLogs: SleepLog[],
  adjustments: DayAdjustment[],
  day: string,
  now: number,
): DayPlan {
  const dayStart = planDayStart(day);
  const age = computeAge(child.birthDate, dayStart + 8 * HOUR, child.premature, child.weeksEarly);
  const row = scheduleFor(age.months);
  const band = ageBandFor(age.months);
  const logs = allLogs.filter((l) => l.childId === child.id);

  // Morning wake: a night that ended this morning.
  const morning = logs
    .filter((l) => l.type === 'night' && l.end !== null && l.end >= dayStart && l.end < dayStart + 12 * HOUR)
    .sort((a, b) => (b.end ?? 0) - (a.end ?? 0))[0];
  const wakeLogged = Boolean(morning);
  const wake = morning?.end ?? atClock(day, child.wakeTime);

  const napTarget = avg(row.napLength) * MIN;
  const naps = logs
    .filter((l) => l.type === 'nap' && planDayKey(l.start) === day)
    .sort((a, b) => a.start - b.start);
  const missed = adjustments
    .filter((a) => a.childId === child.id && a.day === day && a.kind === 'missedNap')
    .sort((a, b) => a.at - b.at);
  const shortAdj = adjustments.filter((a) => a.childId === child.id && a.day === day && a.kind === 'shortNap');

  const bedEarliest = atClock(day, row.bedtime[0]);
  const bedLatest = atClock(day, row.bedtime[1]);

  const items: PlanItem[] = [];
  let cursor = wake;
  let idx = 0;
  let shortenNext = false;
  let shortCount = shortAdj.length;

  // Walk logged naps and "missed nap" reports in time order.
  const events = [
    ...naps.map((n) => ({ at: n.start, nap: n as SleepLog | undefined })),
    ...missed.map((m) => ({ at: m.at, nap: undefined as SleepLog | undefined })),
  ].sort((a, b) => a.at - b.at);

  for (const ev of events) {
    if (ev.nap) {
      const n = ev.nap;
      const end = n.end ?? Math.max(n.start + napTarget, now);
      items.push({ kind: 'nap', start: n.start, end, status: n.end === null ? 'ongoing' : 'done', logId: n.id });
      cursor = end;
      shortenNext = n.end !== null && n.end - n.start < rules.shortNapMinutes * MIN;
      if (shortenNext) shortCount++;
    } else {
      const start = cursor + (shortenNext ? row.wakeWindow[0] : wakeWindow(row, idx)) * MIN;
      items.push({ kind: 'nap', start, status: 'missed' });
      // The skipped nap still "uses" its slot; the next one comes after the shortest window.
      cursor = start;
      shortenNext = true;
    }
    idx++;
  }
  if (shortAdj.length > 0) shortenNext = true;

  // Remaining planned naps, dropped if they no longer fit before bedtime.
  for (; idx < row.naps; idx++) {
    const start = cursor + (shortenNext ? row.wakeWindow[0] : wakeWindow(row, idx)) * MIN;
    if (start + row.wakeWindow[0] * MIN > bedLatest) break;
    const end = start + napTarget;
    items.push({ kind: 'nap', start, end, status: 'planned' });
    cursor = end;
    shortenNext = false;
  }

  const missedCount = items.filter((i) => i.status === 'missed').length;
  const raw = cursor + wakeWindow(row, row.naps) * MIN;
  let bedtime = Math.min(Math.max(raw, bedEarliest), bedLatest);
  const unshifted = bedtime;
  const shift = missedCount * rules.missedNapBedtimeEarlier + shortCount * rules.shortNapBedtimeEarlier;
  if (shift > 0) {
    bedtime = Math.max(bedtime - shift * MIN, bedEarliest - rules.maxEarlierThanUsual * MIN);
  }
  bedtime = Math.round(bedtime / (5 * MIN)) * 5 * MIN;

  const night = logs.find((l) => l.type === 'night' && planDayKey(l.start) === day);
  items.push(
    night
      ? { kind: 'bedtime', start: night.start, status: night.end === null ? 'ongoing' : 'done', logId: night.id }
      : { kind: 'bedtime', start: bedtime, status: 'planned' },
  );

  return {
    day,
    months: age.months,
    band,
    row,
    wake,
    wakeLogged,
    items,
    bedtime: night ? night.start : bedtime,
    routineStart: (night ? night.start : bedtime) - rules.routineMinutes * MIN,
    bedtimeShift: Math.max(0, Math.round((unshifted - bedtime) / MIN)),
    hasNaps: row.naps > 0,
  };
}

/** Night theme is on from (bedtime − 30 min) until the morning wake-up. */
export function isNightTime(plan: DayPlan, now: number): boolean {
  if (now < plan.wake && !plan.wakeLogged) return true;
  return now >= plan.bedtime - rules.nightThemeBeforeBedtime * MIN;
}
