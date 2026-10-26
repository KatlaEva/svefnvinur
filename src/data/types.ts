export type Goal = 'fewerWakings' | 'easierFallingAsleep' | 'longerNaps' | 'laterMornings';
export type SleepType = 'nap' | 'night' | 'waking';
export type Ease = 'easy' | 'some' | 'hard';
export type Place = 'bed' | 'stroller' | 'car' | 'arms';
export type NightModeSetting = 'auto' | 'always' | 'never';
export type HelpFlowId = 'nightWaking' | 'wontSleep' | 'shortNap' | 'missedNap' | 'earlyWaking';

export interface Child {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  birthDate: string;
  premature: boolean;
  weeksEarly: number;
  /** HH:MM, usual morning wake-up */
  wakeTime: string;
  goal: Goal;
  demo?: boolean;
}

export interface SleepLog {
  id: string;
  childId: string;
  type: SleepType;
  /** epoch ms; for night sleep: fell asleep */
  start: number;
  /** epoch ms, null while the timer is running */
  end: number | null;
  /** night sleep only: put in bed */
  inBed?: number;
  ease?: Ease;
  place?: Place;
  note?: string;
  demo?: boolean;
}

export interface HelpOutcome {
  id: string;
  childId: string;
  flowId: HelpFlowId;
  at: number;
  result: 'worked' | 'notFit' | 'finished';
  demo?: boolean;
}

/** Today's plan was changed by a help flow ("missed nap", "short nap"). */
export interface DayAdjustment {
  id: string;
  childId: string;
  /** plan day, YYYY-MM-DD */
  day: string;
  kind: 'missedNap' | 'shortNap';
  at: number;
}

export interface RoutineDay {
  childId: string;
  day: string;
  startedAt?: number;
  /** set when the whole checklist is ticked off: counts as "í rúmið" */
  inBedAt?: number;
  done: string[];
}

export interface Settings {
  notifications: boolean;
  nightMode: NightModeSetting;
  routine: string[];
  demo: boolean;
}

export interface ThemeOverride {
  theme: 'day' | 'night';
  setAt: number;
  /** what the automatic theme was when the override was set */
  autoAtSet: 'day' | 'night';
}

export interface AppState {
  version: 1;
  children: Child[];
  activeChildId: string | null;
  logs: SleepLog[];
  outcomes: HelpOutcome[];
  adjustments: DayAdjustment[];
  routineDays: RoutineDay[];
  settings: Settings;
  themeOverride: ThemeOverride | null;
  notifiedDays: string[];
}
