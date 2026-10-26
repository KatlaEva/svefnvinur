import { describe, expect, it } from 'vitest';
import { computeNow } from '../src/lib/now';
import { buildDayPlan } from '../src/lib/schedule';
import type { SleepLog } from '../src/data/types';
import { bigKid, DAY, log, t, toddler } from './helpers';

function state(now: number, logs: SleepLog[] = [], child = toddler, startedAt?: number) {
  const plan = buildDayPlan(child, logs, [], DAY, now);
  return computeNow({
    now,
    plan,
    logs,
    routineDay: startedAt ? { childId: child.id, day: DAY, startedAt, done: [] } : undefined,
  });
}

describe('computeNow', () => {
  it('is night before the usual wake-up with nothing logged', () => {
    expect(state(t('05:00')).kind).toBe('night');
  });

  it('counts down to the next nap when awake', () => {
    const s = state(t('09:00'));
    expect(s.kind).toBe('awake');
    expect(s.minutes).toBe(75);
    expect(s.primary.id).toBe('startNap');
  });

  it('says the nap is due once the planned time passes', () => {
    const s = state(t('10:30'));
    expect(s.kind).toBe('napDue');
    expect(s.secondary?.id).toBe('missedNap');
  });

  it('shows a running nap', () => {
    const s = state(t('10:40'), [log('nap', t('10:15'), null)]);
    expect(s.kind).toBe('napping');
    expect(s.since).toBe(t('10:15'));
    expect(s.primary.id).toBe('endNap');
  });

  it('counts down to the routine when no naps are left', () => {
    const logs = [log('nap', t('10:00'), t('11:00')), log('nap', t('14:30'), t('15:30'))];
    const plan = buildDayPlan(toddler, logs, [], DAY, t('17:45'));
    const s = computeNow({ now: plan.routineStart - 20 * 60_000, plan, logs });
    expect(s.kind).toBe('routineSoon');
    expect(s.minutes).toBe(20);
    expect(s.primary.id).toBe('startRoutine');
  });

  it('is in the routine at routine time, or once started manually', () => {
    const logs = [log('nap', t('10:00'), t('11:00')), log('nap', t('14:30'), t('15:30'))];
    const plan = buildDayPlan(toddler, logs, [], DAY, t('18:00'));
    expect(computeNow({ now: plan.routineStart + 60_000, plan, logs }).kind).toBe('routine');
    expect(state(t('17:30'), logs, toddler, t('17:25')).kind).toBe('routine');
    expect(computeNow({ now: plan.routineStart + 60_000, plan, logs }).primary.id).toBe('fellAsleep');
  });

  it('is night while the night timer runs and handles wakings', () => {
    const night = log('night', t('19:00'), null);
    expect(state(t('22:00'), [night]).kind).toBe('night');
    expect(state(t('22:00'), [night]).primary.id).toBe('startWaking');
    const s = state(t('23:00'), [night, log('waking', t('22:50'), null)]);
    expect(s.kind).toBe('nightWaking');
    expect(s.primary.id).toBe('endWaking');
  });

  it('offers "woke up" near the morning', () => {
    const night = log('night', t('19:00', '2026-10-25'), null);
    expect(state(t('06:30'), [night]).primary.id).toBe('wokeUp');
  });

  it('is night late in the evening even without a log', () => {
    const s = state(t('23:30'));
    expect(s.kind).toBe('night');
    expect(s.primary.id).toBe('openSheet');
  });

  it('shows bedtime countdown for older children', () => {
    const s = state(t('12:00'), [], bigKid);
    expect(s.kind).toBe('awakeUntilBedtime');
    expect(s.minutes).toBe(7 * 60 + 30);
  });
});
