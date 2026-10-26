import { Check, Moon, Play, Square, Sunrise } from 'lucide-react';
import { useApp } from '../AppContext';
import { rules } from '../content/advice';
import { is } from '../content/is';
import { toggleRoutineItem } from '../data/store';
import { useClock } from '../hooks/useClock';
import type { NowAction, NowState } from '../lib/now';
import { fmtDuration, fmtTimer } from '../lib/format';
import { fmtTime, MIN } from '../lib/time';

function LiveTimer({ since }: { since: number }) {
  const now = useClock(1000);
  return (
    <p className="timer" aria-live="off">
      {fmtTimer(now - since)}
    </p>
  );
}

function actionLabel(a: NowAction, name: string): string {
  const L = is.now.actions;
  switch (a.id) {
    case 'startNap':
      return L.startNap;
    case 'endNap':
      return L.endNap(name);
    case 'startRoutine':
      return L.startRoutine;
    case 'fellAsleep':
      return L.fellAsleep(name);
    case 'startWaking':
      return L.startWaking;
    case 'endWaking':
      return L.endWaking;
    case 'wokeUp':
      return L.wokeUp;
    case 'missedNap':
      return L.missedNap;
    case 'openSheet':
      return a.preset.type === 'night' ? L.logNight : L.logSleep;
  }
}

function ActionIcon({ a }: { a: NowAction }) {
  if (a.id === 'startNap' || a.id === 'startRoutine' || a.id === 'startWaking') return <Play size={20} aria-hidden="true" />;
  if (a.id === 'endNap' || a.id === 'endWaking') return <Square size={18} aria-hidden="true" />;
  if (a.id === 'fellAsleep') return <Moon size={20} aria-hidden="true" />;
  if (a.id === 'wokeUp') return <Sunrise size={20} aria-hidden="true" />;
  return null;
}

function texts(s: NowState, now: number): { title: string; sub?: string } {
  const N = is.now;
  const awakeSince = s.since ? N.awakeSince(fmtTime(s.since), fmtDuration((now - s.since) / MIN)) : undefined;
  switch (s.kind) {
    case 'awake':
      return { title: N.awake(fmtDuration(s.minutes ?? 0)), sub: [s.at && N.awakeAt(fmtTime(s.at)), awakeSince].filter(Boolean).join(' · ') };
    case 'napDue':
      return { title: N.napDue, sub: s.at ? N.napDueSub(fmtTime(s.at)) : undefined };
    case 'awakeUntilBedtime':
      return { title: N.awakeUntilBedtime(fmtTime(s.at ?? now)), sub: awakeSince };
    case 'napping':
      return { title: N.napping, sub: s.since ? N.nappingSince(fmtTime(s.since)) : undefined };
    case 'routineSoon':
      return { title: N.routineSoon(fmtDuration(s.minutes ?? 0)), sub: s.at ? N.routineSoonSub(fmtTime(s.at + rules.routineMinutes * MIN)) : undefined };
    case 'routine':
      return { title: N.routine, sub: s.at ? N.routineSub(fmtTime(s.at)) : undefined };
    case 'night':
      return { title: N.night, sub: s.since ? N.nightSince(fmtTime(s.since), fmtDuration((now - s.since) / MIN)) : N.nightNoLog };
    case 'nightWaking':
      return { title: N.nightWaking, sub: s.since ? N.nightWakingSince(fmtTime(s.since)) : undefined };
  }
}

export function NowCard() {
  const { nowState, child, now, run, state, routineDay } = useApp();
  if (!nowState || !child) return null;
  const { title, sub } = texts(nowState, now);
  const showTimer = nowState.since && (nowState.kind === 'napping' || nowState.kind === 'nightWaking');
  const routine = state.settings.routine;
  const done = routineDay?.done ?? [];

  return (
    <section className="card now-card" aria-labelledby="now-title">
      <p className="card-label">{is.now.label}</p>
      <div>
        <h1 id="now-title" className="now-title">
          {title}
        </h1>
        {sub && <p className="now-sub">{sub}</p>}
      </div>
      {showTimer && <LiveTimer since={nowState.since as number} />}

      {nowState.kind === 'routine' && routine.length > 0 && (
        <div>
          <p className="muted small" style={{ marginBottom: 8 }}>
            {is.routine.title} · {is.routine.progress(routine.filter((r) => done.includes(r)).length, routine.length)}
          </p>
          <ul className="checklist">
            {routine.map((item) => {
              const checked = done.includes(item);
              return (
                <li key={item}>
                  <button type="button" role="checkbox" aria-checked={checked} className="check-item" onClick={() => toggleRoutineItem(child.id, item)}>
                    <span className="check-box" aria-hidden="true">
                      {checked && <Check size={18} strokeWidth={3} />}
                    </span>
                    <span className="check-label">{item}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => run(nowState.primary)}>
        <ActionIcon a={nowState.primary} />
        {actionLabel(nowState.primary, child.name)}
      </button>
      {nowState.secondary && (
        <button type="button" className="btn btn-secondary btn-block" onClick={() => run(nowState.secondary as NowAction)}>
          {actionLabel(nowState.secondary, child.name)}
        </button>
      )}
    </section>
  );
}
