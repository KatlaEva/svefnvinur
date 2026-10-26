// The single storage module. Everything is kept on this device in localStorage
// under a versioned schema. Swap the internals here to add a backend later.

import { defaultRoutine } from '../content/advice';
import { MIN, planDayKey, roundToMinute, uid } from '../lib/time';
import type {
  AppState,
  Child,
  DayAdjustment,
  HelpOutcome,
  RoutineDay,
  Settings,
  SleepLog,
  SleepType,
  ThemeOverride,
} from './types';

const KEY = 'svefnvinur:v1';
export const SCHEMA_VERSION = 1;

export function initialState(): AppState {
  return {
    version: 1,
    children: [],
    activeChildId: null,
    logs: [],
    outcomes: [],
    adjustments: [],
    routineDays: [],
    settings: { notifications: false, nightMode: 'auto', routine: [...defaultRoutine], demo: false },
    themeOverride: null,
    notifiedDays: [],
  };
}

/** Brings any stored/imported object up to the current schema, or throws. */
export function migrate(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') throw new Error('invalid');
  const data = raw as Partial<AppState> & { version?: number };
  if (data.version !== 1) throw new Error('version');
  if (!Array.isArray(data.children) || !Array.isArray(data.logs)) throw new Error('invalid');
  const base = initialState();
  return {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    outcomes: data.outcomes ?? [],
    adjustments: data.adjustments ?? [],
    routineDays: data.routineDays ?? [],
    notifiedDays: data.notifiedDays ?? [],
    themeOverride: data.themeOverride ?? null,
    version: 1,
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : initialState();
  } catch {
    return initialState();
  }
}

let state: AppState = typeof localStorage === 'undefined' ? initialState() : load();
const listeners = new Set<() => void>();

function commit(next: AppState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable: keep working in memory
  }
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keep several open tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

const update = (fn: (s: AppState) => Partial<AppState>) => commit({ ...state, ...fn(state) });

// ---------- children ----------

export function addChild(child: Omit<Child, 'id'>): Child {
  const c: Child = { ...child, id: uid() };
  update((s) => ({ children: [...s.children, c], activeChildId: c.id }));
  return c;
}

export function updateChild(id: string, patch: Partial<Omit<Child, 'id'>>) {
  update((s) => ({ children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

export function deleteChild(id: string) {
  update((s) => {
    const children = s.children.filter((c) => c.id !== id);
    return {
      children,
      activeChildId: s.activeChildId === id ? (children[0]?.id ?? null) : s.activeChildId,
      logs: s.logs.filter((l) => l.childId !== id),
      outcomes: s.outcomes.filter((o) => o.childId !== id),
      adjustments: s.adjustments.filter((a) => a.childId !== id),
      routineDays: s.routineDays.filter((r) => r.childId !== id),
    };
  });
}

export function setActiveChild(id: string) {
  update(() => ({ activeChildId: id }));
}

// ---------- sleep logs ----------

/** Only one timer of each kind; starting a nap or night ends any other running timer. */
export function startTimer(childId: string, type: SleepType, start = Date.now()): SleepLog {
  const s = roundToMinute(start);
  const log: SleepLog = { id: uid(), childId, type, start: s, end: null };
  update((st) => ({
    logs: [
      ...st.logs.map((l) =>
        l.childId === childId && l.end === null && (type !== 'waking' || l.type === 'waking')
          ? { ...l, end: Math.max(s, l.start + MIN) }
          : l,
      ),
      log,
    ],
  }));
  return log;
}

export function stopTimer(childId: string, type: SleepType, end = Date.now()) {
  const e = roundToMinute(end);
  update((s) => ({
    logs: s.logs.map((l) =>
      l.childId === childId && l.type === type && l.end === null ? { ...l, end: Math.max(e, l.start + MIN) } : l,
    ),
  }));
}

export function addLog(log: Omit<SleepLog, 'id'>): SleepLog {
  const l: SleepLog = { ...log, id: uid() };
  update((s) => ({
    logs: [
      // a new running timer replaces an older running timer of the same type
      ...s.logs.map((x) =>
        l.end === null && x.childId === l.childId && x.type === l.type && x.end === null
          ? { ...x, end: Math.max(l.start, x.start + MIN) }
          : x,
      ),
      l,
    ],
  }));
  return l;
}

export function updateLog(id: string, patch: Partial<Omit<SleepLog, 'id'>>) {
  update((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
}

export function deleteLog(id: string) {
  update((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));
}

// ---------- help outcomes & day adjustments ----------

export function logOutcome(o: Omit<HelpOutcome, 'id'>) {
  update((s) => ({ outcomes: [...s.outcomes, { ...o, id: uid() }] }));
}

export function addAdjustment(a: Omit<DayAdjustment, 'id'>) {
  update((s) => ({ adjustments: [...s.adjustments, { ...a, id: uid() }] }));
}

export function removeAdjustment(id: string) {
  update((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) }));
}

// ---------- evening routine ----------

function routineFor(s: AppState, childId: string, day: string): RoutineDay {
  return s.routineDays.find((r) => r.childId === childId && r.day === day) ?? { childId, day, done: [] };
}

function putRoutine(s: AppState, r: RoutineDay) {
  // keep two weeks of routine history
  const rest = s.routineDays.filter((x) => !(x.childId === r.childId && x.day === r.day)).slice(-30);
  return { routineDays: [...rest, r] };
}

export function startRoutine(childId: string, now = Date.now()) {
  const day = planDayKey(now);
  update((s) => putRoutine(s, { ...routineFor(s, childId, day), startedAt: now }));
}

export function toggleRoutineItem(childId: string, item: string, now = Date.now()) {
  const day = planDayKey(now);
  update((s) => {
    const r = routineFor(s, childId, day);
    const done = r.done.includes(item) ? r.done.filter((d) => d !== item) : [...r.done, item];
    const complete = s.settings.routine.every((i) => done.includes(i));
    return putRoutine(s, { ...r, startedAt: r.startedAt ?? now, done, inBedAt: complete ? (r.inBedAt ?? now) : undefined });
  });
}

// ---------- settings ----------

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function setThemeOverride(o: ThemeOverride | null) {
  update(() => ({ themeOverride: o }));
}

export function markNotified(key: string) {
  update((s) => ({ notifiedDays: [...s.notifiedDays.slice(-20), key] }));
}

// ---------- demo data ----------

export function replaceDemoData(children: Child[], logs: SleepLog[], outcomes: HelpOutcome[]) {
  update((s) => {
    const keptChildren = s.children.filter((c) => !c.demo);
    const allChildren = [...keptChildren, ...children];
    return {
      children: allChildren,
      activeChildId: children[0]?.id ?? (s.children.find((c) => c.id === s.activeChildId && !c.demo)?.id ?? keptChildren[0]?.id ?? null),
      logs: [...s.logs.filter((l) => !l.demo), ...logs],
      outcomes: [...s.outcomes.filter((o) => !o.demo), ...outcomes],
      settings: { ...s.settings, demo: children.length > 0 },
    };
  });
}

// ---------- import / export ----------

export function exportData(): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importData(json: string): void {
  const next = migrate(JSON.parse(json));
  delete (next as Partial<AppState> & { exportedAt?: string }).exportedAt;
  commit(next);
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  commit(initialState());
}
