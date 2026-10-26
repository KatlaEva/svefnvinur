import { rules } from '../content/advice';
import type { RoutineDay, SleepLog, SleepType } from '../data/types';
import type { DayPlan } from './schedule';
import { MIN } from './time';

export type NowKind =
  | 'awake' // next nap in X min
  | 'napDue' // planned nap time has passed
  | 'awakeUntilBedtime' // no naps left (or none at this age)
  | 'napping'
  | 'routineSoon'
  | 'routine'
  | 'night'
  | 'nightWaking';

export interface SheetPreset {
  type: SleepType;
  start: number;
  end: number | null;
}

export type NowAction =
  | { id: 'startNap' }
  | { id: 'endNap' }
  | { id: 'startRoutine' }
  | { id: 'fellAsleep' }
  | { id: 'startWaking' }
  | { id: 'endWaking' }
  | { id: 'wokeUp' }
  | { id: 'missedNap' }
  | { id: 'openSheet'; preset: SheetPreset };

export interface NowState {
  kind: NowKind;
  /** target moment (next nap, bedtime, routine start) */
  at?: number;
  /** start of the running timer / awake since */
  since?: number;
  /** whole minutes until `at` (never negative) */
  minutes?: number;
  primary: NowAction;
  secondary?: NowAction;
}

export interface NowInput {
  now: number;
  plan: DayPlan;
  /** this child's logs */
  logs: SleepLog[];
  routineDay?: RoutineDay;
}

const minutesUntil = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / MIN));

export function computeNow({ now, plan, logs, routineDay }: NowInput): NowState {
  const ongoing = (type: SleepType) => logs.find((l) => l.type === type && l.end === null);

  const waking = ongoing('waking');
  if (waking) return { kind: 'nightWaking', since: waking.start, primary: { id: 'endWaking' } };

  const nap = ongoing('nap');
  if (nap) return { kind: 'napping', since: nap.start, primary: { id: 'endNap' } };

  const night = ongoing('night');
  if (night) {
    const nearMorning = now >= plan.wake - 60 * MIN && now - night.start > 4 * 60 * MIN;
    return nearMorning
      ? { kind: 'night', since: night.start, primary: { id: 'wokeUp' }, secondary: { id: 'startWaking' } }
      : { kind: 'night', since: night.start, primary: { id: 'startWaking' }, secondary: { id: 'wokeUp' } };
  }

  // Before the morning wake-up with nothing logged: still night.
  if (now < plan.wake && !plan.wakeLogged) {
    return {
      kind: 'night',
      primary: { id: 'startWaking' },
      secondary: { id: 'openSheet', preset: { type: 'night', start: plan.bedtime - 24 * 60 * MIN, end: now } },
    };
  }

  const bedItem = plan.items.find((i) => i.kind === 'bedtime');
  if (bedItem && bedItem.status === 'done') {
    // Night already logged as finished this evening; treat as night.
    return { kind: 'night', primary: { id: 'startWaking' } };
  }

  const lateNight = now >= plan.bedtime + 90 * MIN;
  if (lateNight) {
    return {
      kind: 'night',
      primary: { id: 'openSheet', preset: { type: 'night', start: plan.bedtime, end: null } },
      secondary: { id: 'startWaking' },
    };
  }

  const routineStarted = Boolean(routineDay?.startedAt);
  if (routineStarted || now >= plan.routineStart) {
    return {
      kind: 'routine',
      at: plan.bedtime,
      minutes: minutesUntil(plan.bedtime, now),
      since: routineDay?.startedAt ?? plan.routineStart,
      primary: { id: 'fellAsleep' },
    };
  }

  const lastSleepEnd = Math.max(
    plan.wake,
    ...plan.items.filter((i) => i.kind === 'nap' && i.status === 'done' && i.end).map((i) => i.end as number),
  );

  const nextNap = plan.items.find((i) => i.kind === 'nap' && i.status === 'planned');
  if (nextNap) {
    if (now >= nextNap.start) {
      return {
        kind: 'napDue',
        at: nextNap.start,
        since: lastSleepEnd,
        minutes: 0,
        primary: { id: 'startNap' },
        secondary: { id: 'missedNap' },
      };
    }
    return {
      kind: 'awake',
      at: nextNap.start,
      since: lastSleepEnd,
      minutes: minutesUntil(nextNap.start, now),
      primary: { id: 'startNap' },
    };
  }

  if (now >= plan.routineStart - rules.routineSoonMinutes * MIN) {
    return {
      kind: 'routineSoon',
      at: plan.routineStart,
      since: lastSleepEnd,
      minutes: minutesUntil(plan.routineStart, now),
      primary: { id: 'startRoutine' },
    };
  }

  return {
    kind: 'awakeUntilBedtime',
    at: plan.bedtime,
    since: lastSleepEnd,
    minutes: minutesUntil(plan.bedtime, now),
    primary: { id: 'openSheet', preset: { type: plan.hasNaps ? 'nap' : 'night', start: now, end: null } },
  };
}
