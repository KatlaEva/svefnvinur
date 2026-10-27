import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { rules } from './content/advice';
import { is } from './content/is';
import * as store from './data/store';
import type { AppState, Child, HelpFlowId, RoutineDay, SleepLog } from './data/types';
import { useAppState } from './hooks/useAppState';
import { useClock } from './hooks/useClock';
import { computeNow, type NowAction, type NowState, type SheetPreset } from './lib/now';
import { buildDayPlan, isNightTime, type DayPlan } from './lib/schedule';
import { MIN, planDayKey } from './lib/time';

export type Tab = 'today' | 'help' | 'progress' | 'more';
export interface Route {
  tab: Tab;
  flow?: HelpFlowId;
}

const tabHash: Record<Tab, string> = { today: 'i-dag', help: 'hjalp', progress: 'framfarir', more: 'meira' };

function parseHash(hash: string): Route {
  const [tabPart, flow] = hash.replace(/^#\/?/, '').split('/');
  const tab = (Object.keys(tabHash) as Tab[]).find((t) => tabHash[t] === tabPart) ?? 'today';
  return { tab, flow: tab === 'help' && flow ? (flow as HelpFlowId) : undefined };
}

export type SheetRequest = { preset?: SheetPreset; log?: SleepLog };

interface Ctx {
  state: AppState;
  now: number;
  child: Child | null;
  plan: DayPlan | null;
  nowState: NowState | null;
  childLogs: SleepLog[];
  routineDay?: RoutineDay;
  theme: 'day' | 'night';
  autoTheme: 'day' | 'night';
  route: Route;
  go: (tab: Tab, flow?: HelpFlowId) => void;
  sheet: SheetRequest | null;
  openSheet: (req?: SheetRequest) => void;
  closeSheet: () => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  run: (action: NowAction) => void;
  toggleTheme: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  const now = useClock(60_000);
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  const [sheet, setSheet] = useState<SheetRequest | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);

  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((tab: Tab, flow?: HelpFlowId) => {
    const hash = `#/${tabHash[tab]}${flow ? `/${flow}` : ''}`;
    if (location.hash !== hash) location.hash = hash;
    else setRoute(parseHash(hash));
    window.scrollTo(0, 0);
  }, []);

  const child = state.children.find((c) => c.id === state.activeChildId) ?? state.children[0] ?? null;
  const day = planDayKey(now);
  const childLogs = useMemo(() => (child ? state.logs.filter((l) => l.childId === child.id) : []), [state.logs, child]);
  const plan = useMemo(
    () => (child ? buildDayPlan(child, childLogs, state.adjustments, day, now) : null),
    [child, childLogs, state.adjustments, day, now],
  );
  const routineDay = child ? state.routineDays.find((r) => r.childId === child.id && r.day === day) : undefined;
  const nowState = useMemo(
    () => (plan ? computeNow({ now, plan, logs: childLogs, routineDay }) : null),
    [plan, now, childLogs, routineDay],
  );

  // ---------- theme ----------
  const sleepingNow = childLogs.some((l) => l.end === null && (l.type === 'night' || l.type === 'waking'));
  const baseTheme: 'day' | 'night' =
    state.settings.nightMode === 'always'
      ? 'night'
      : state.settings.nightMode === 'never' || !plan
        ? 'day'
        : isNightTime(plan, now) || sleepingNow
          ? 'night'
          : 'day';
  const override = state.themeOverride;
  const overrideValid = override && override.autoAtSet === baseTheme && now - override.setAt < 12 * 60 * MIN;
  const theme = overrideValid ? override.theme : baseTheme;

  useEffect(() => {
    if (override && !overrideValid) store.setThemeOverride(null);
  }, [override, overrideValid]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#120F0C' : '#FAF6EF');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    store.setThemeOverride({ theme: theme === 'night' ? 'day' : 'night', setAt: Date.now(), autoAtSet: baseTheme });
  }, [theme, baseTheme]);

  // ---------- toast ----------
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // ---------- local reminder before the evening routine ----------
  useEffect(() => {
    if (!child || !plan || !state.settings.notifications) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const key = `${child.id}:${plan.day}`;
    if (state.notifiedDays.includes(key)) return;
    const fireAt = plan.routineStart - rules.reminderBeforeRoutine * MIN;
    if (now > plan.routineStart) return;
    const fire = () => {
      store.markNotified(key);
      const body = is.notify.body(child.name, rules.reminderBeforeRoutine);
      navigator.serviceWorker?.ready
        .then((reg) => reg.showNotification(is.notify.title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png`, tag: key }))
        .catch(() => new Notification(is.notify.title, { body }));
    };
    if (now >= fireAt) {
      fire();
      return;
    }
    const t = window.setTimeout(fire, fireAt - Date.now());
    return () => window.clearTimeout(t);
  }, [child, plan, now, state.settings.notifications, state.notifiedDays]);

  // ---------- NÚNA actions ----------
  const run = useCallback(
    (action: NowAction) => {
      if (!child) return;
      const t = Date.now();
      switch (action.id) {
        case 'startNap':
          store.startTimer(child.id, 'nap', t);
          break;
        case 'endNap':
          store.stopTimer(child.id, 'nap', t);
          break;
        case 'startRoutine':
          store.startRoutine(child.id, t);
          break;
        case 'fellAsleep': {
          const log = store.startTimer(child.id, 'night', t);
          if (routineDay?.inBedAt) store.updateLog(log.id, { inBed: routineDay.inBedAt });
          break;
        }
        case 'startWaking':
          store.startTimer(child.id, 'waking', t);
          break;
        case 'endWaking':
          store.stopTimer(child.id, 'waking', t);
          break;
        case 'wokeUp':
          store.stopTimer(child.id, 'waking', t);
          store.stopTimer(child.id, 'night', t);
          break;
        case 'missedNap':
          go('help', 'missedNap');
          break;
        case 'openSheet':
          setSheet({ preset: action.preset });
          break;
      }
    },
    [child, routineDay, go],
  );

  const value: Ctx = {
    state,
    now,
    child,
    plan,
    nowState,
    childLogs,
    routineDay,
    theme,
    autoTheme: baseTheme,
    route,
    go,
    sheet,
    openSheet: useCallback((req?: SheetRequest) => setSheet(req ?? {}), []),
    closeSheet: useCallback(() => setSheet(null), []),
    toast,
    toastMsg,
    run,
    toggleTheme,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
