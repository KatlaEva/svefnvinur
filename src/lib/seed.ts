import type { Child, HelpOutcome, SleepLog } from '../data/types';
import { addDays, atClock, dateKey, MIN, planDayKey, uid } from './time';

/** Small deterministic PRNG so the demo looks the same every time. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 14 days of realistic logs for a 14-month-old, with night wakings improving over time. */
export function buildDemo(now: number): { children: Child[]; logs: SleepLog[]; outcomes: HelpOutcome[] } {
  const birth = new Date(now);
  birth.setMonth(birth.getMonth() - 14);
  birth.setDate(birth.getDate() - 9);
  const child: Child = {
    id: uid(),
    name: 'Theódór',
    birthDate: dateKey(birth),
    premature: false,
    weeksEarly: 0,
    wakeTime: '07:00',
    goal: 'fewerWakings',
    demo: true,
  };
  const r = rng(14);
  const jitter = (spread: number) => Math.round((r() - 0.5) * 2 * spread) * MIN;
  const logs: SleepLog[] = [];
  const outcomes: HelpOutcome[] = [];
  const today = planDayKey(now);
  const ease = ['easy', 'easy', 'some', 'hard'] as const;
  const place = ['bed', 'bed', 'bed', 'stroller', 'car'] as const;

  for (let i = 14; i >= 1; i--) {
    const day = addDays(today, -i);
    const next = addDays(day, 1);
    const progress = (14 - i) / 13; // 0 → 1

    const nap1 = atClock(day, '09:45') + jitter(20);
    const nap1End = nap1 + (55 + Math.round(r() * 35)) * MIN;
    logs.push({ id: uid(), childId: child.id, type: 'nap', start: nap1, end: nap1End, ease: ease[Math.floor(r() * 3)], place: place[Math.floor(r() * 5)], demo: true });
    if (i % 5 !== 0) {
      const nap2 = atClock(day, '14:10') + jitter(25);
      logs.push({ id: uid(), childId: child.id, type: 'nap', start: nap2, end: nap2 + (35 + Math.round(r() * 45)) * MIN, ease: ease[Math.floor(r() * 4)], place: place[Math.floor(r() * 5)], demo: true });
    }

    const asleep = atClock(day, '19:15') + jitter(25) - Math.round(progress * 15) * MIN;
    const wake = atClock(next, '06:45') + jitter(25) + Math.round(progress * 15) * MIN;
    logs.push({ id: uid(), childId: child.id, type: 'night', start: asleep, end: wake, inBed: asleep - (8 + Math.round(r() * 15)) * MIN, ease: progress > 0.5 ? 'easy' : ease[Math.floor(r() * 4)], place: 'bed', demo: true });

    const wakings = Math.max(0, Math.round(3 - progress * 2.4 + (r() - 0.5) * 1.2));
    for (let w = 0; w < wakings; w++) {
      const at = asleep + ((w + 1) * (wake - asleep)) / (wakings + 1) + jitter(30);
      const len = (5 + Math.round(r() * (20 - progress * 12))) * MIN;
      logs.push({ id: uid(), childId: child.id, type: 'waking', start: at, end: at + len, demo: true });
      if (r() < 0.3) outcomes.push({ id: uid(), childId: child.id, flowId: 'nightWaking', at: at + len, result: 'worked', demo: true });
    }
  }

  // Today: morning wake-up and, depending on the time, the first nap.
  const morning = atClock(today, '06:50');
  const lastNight = logs.filter((l) => l.type === 'night').at(-1);
  if (lastNight) lastNight.end = now > morning ? morning : null;
  const nap = atClock(today, '09:40');
  if (now > nap + 70 * MIN) {
    logs.push({ id: uid(), childId: child.id, type: 'nap', start: nap, end: nap + 70 * MIN, ease: 'easy', place: 'bed', demo: true });
  }
  // Nothing in the future: drop wakings that haven't happened yet.
  const past = logs.filter((l) => l.start < now && (l.end === null || l.end <= now));
  return { children: [child], logs: past, outcomes: outcomes.filter((o) => o.at <= now) };
}
