import type { SleepLog } from '../data/types';
import { addDays, MIN, minutesFromNoon, planDayKey } from './time';

export interface DaySummary {
  day: string;
  hasData: boolean;
  /** night sleep that started on this plan day's evening */
  nightStart?: number;
  inBed?: number;
  /** morning wake at the end of that night */
  wake?: number;
  nightMinutes: number;
  wakings: number;
  napMinutes: number;
  napCount: number;
  totalMinutes: number;
}

const minutes = (l: SleepLog) => (l.end === null ? 0 : Math.max(0, (l.end - l.start) / MIN));

/** One summary per plan day, oldest first, ending with `endDay`. */
export function summarizeDays(logs: SleepLog[], childId: string, endDay: string, count: number): DaySummary[] {
  const own = logs.filter((l) => l.childId === childId && l.end !== null);
  const byDay = new Map<string, SleepLog[]>();
  for (const l of own) {
    const k = planDayKey(l.start);
    const list = byDay.get(k);
    if (list) list.push(l);
    else byDay.set(k, [l]);
  }
  const out: DaySummary[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = addDays(endDay, -i);
    const list = byDay.get(day) ?? [];
    const naps = list.filter((l) => l.type === 'nap');
    const wakings = list.filter((l) => l.type === 'waking');
    const night = list.filter((l) => l.type === 'night').sort((a, b) => minutes(b) - minutes(a))[0];
    const wakingMinutes = wakings.reduce((s, l) => s + minutes(l), 0);
    const nightMinutes = night ? Math.max(0, minutes(night) - wakingMinutes) : 0;
    const napMinutes = naps.reduce((s, l) => s + minutes(l), 0);
    out.push({
      day,
      hasData: list.length > 0,
      nightStart: night?.start,
      inBed: night?.inBed,
      wake: night?.end ?? undefined,
      nightMinutes: Math.round(nightMinutes),
      wakings: wakings.length,
      napMinutes: Math.round(napMinutes),
      napCount: naps.length,
      totalMinutes: Math.round(nightMinutes + napMinutes),
    });
  }
  return out;
}

export function loggedDayCount(days: DaySummary[]): number {
  return days.filter((d) => d.hasData).length;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);

export interface Averages {
  /** clock minutes since midnight */
  inBed?: number;
  asleep?: number;
  wake?: number;
  /** durations in minutes */
  night?: number;
  naps?: number;
  total?: number;
  wakings?: number;
}

const clockAvgEvening = (ms: number[]) => {
  const m = mean(ms.map(minutesFromNoon));
  return m === undefined ? undefined : (m + 720) % 1440;
};

export function averages(days: DaySummary[]): Averages {
  const withNight = days.filter((d) => d.nightStart !== undefined);
  const withNaps = days.filter((d) => d.napCount > 0);
  const full = days.filter((d) => d.nightStart !== undefined);
  return {
    inBed: clockAvgEvening(days.flatMap((d) => (d.inBed ? [d.inBed] : []))),
    asleep: clockAvgEvening(withNight.map((d) => d.nightStart as number)),
    wake: mean(
      days.flatMap((d) => {
        if (!d.wake) return [];
        const w = new Date(d.wake);
        return [w.getHours() * 60 + w.getMinutes()];
      }),
    ),
    night: mean(withNight.map((d) => d.nightMinutes)),
    naps: mean(withNaps.map((d) => d.napMinutes)),
    total: mean(full.map((d) => d.totalMinutes)),
    wakings: mean(withNight.map((d) => d.wakings)),
  };
}

export type Insight =
  | { kind: 'wakingsDown'; from: number; to: number }
  | { kind: 'wakingsUp'; from: number; to: number }
  | { kind: 'totalUp'; minutes: number }
  | { kind: 'asleepEarlier'; minutes: number }
  | { kind: 'average'; total: number; inRange: boolean | null };

/** Compares the first and second half of the range and picks the most useful plain-language insight. */
export function insight(days: DaySummary[], totalRangeHours?: [number, number]): Insight | null {
  const nights = days.filter((d) => d.nightStart !== undefined);
  if (nights.length === 0) return null;
  const half = Math.floor(nights.length / 2);
  if (half >= 2) {
    const first = nights.slice(0, half);
    const second = nights.slice(nights.length - half);
    const wFrom = mean(first.map((d) => d.wakings)) as number;
    const wTo = mean(second.map((d) => d.wakings)) as number;
    if (wFrom - wTo >= 0.5) return { kind: 'wakingsDown', from: wFrom, to: wTo };
    const tFrom = mean(first.map((d) => d.totalMinutes)) as number;
    const tTo = mean(second.map((d) => d.totalMinutes)) as number;
    if (tTo - tFrom >= 15) return { kind: 'totalUp', minutes: Math.round(tTo - tFrom) };
    const aFrom = mean(first.map((d) => minutesFromNoon(d.nightStart as number))) as number;
    const aTo = mean(second.map((d) => minutesFromNoon(d.nightStart as number))) as number;
    if (aFrom - aTo >= 15) return { kind: 'asleepEarlier', minutes: Math.round(aFrom - aTo) };
    if (wTo - wFrom >= 0.5) return { kind: 'wakingsUp', from: wFrom, to: wTo };
  }
  const total = mean(nights.map((d) => d.totalMinutes)) as number;
  const inRange = totalRangeHours
    ? total >= totalRangeHours[0] * 60 && total <= totalRangeHours[1] * 60
    : null;
  return { kind: 'average', total: Math.round(total), inRange };
}
