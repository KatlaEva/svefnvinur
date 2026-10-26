import { Baby, BedDouble, CloudMoon, Moon, Sun, Sunrise } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../AppContext';
import { is } from '../content/is';
import type { SleepLog } from '../data/types';
import { fmtDuration } from '../lib/format';
import { fmtTime, MIN, planDayKey, planDayStart, HOUR } from '../lib/time';

interface Row {
  key: string;
  at: number;
  title: string;
  meta?: string;
  icon: ReactNode;
  variant?: 'planned' | 'missed';
  log?: SleepLog;
}

export function Timeline() {
  const { plan, childLogs, now, openSheet } = useApp();
  if (!plan) return null;
  const T = is.today;
  const rows: Row[] = [];
  const dayStart = planDayStart(plan.day);
  const dur = (l: SleepLog) => fmtDuration(((l.end ?? now) - l.start) / MIN);
  const byId = (id?: string) => childLogs.find((l) => l.id === id);

  const morning = childLogs.find((l) => l.type === 'night' && l.end !== null && l.end === plan.wake && l.end >= dayStart && l.end < dayStart + 12 * HOUR);
  if (plan.wakeLogged && morning) {
    rows.push({ key: 'wake', at: plan.wake, title: T.wokeUp, meta: is.now.nightSince(fmtTime(morning.start), dur(morning)), icon: <Sunrise size={16} />, log: morning });
  } else if (now < plan.wake) {
    rows.push({ key: 'wake', at: plan.wake, title: T.wokeUpPlanned, icon: <Sun size={16} />, variant: 'planned' });
  }

  const nextPlanned = plan.items.find((i) => i.kind === 'nap' && i.status === 'planned' && i.start > now);
  plan.items.forEach((item, i) => {
    const log = byId(item.logId);
    if (item.kind === 'nap') {
      if (item.status === 'done' && log) rows.push({ key: `n${i}`, at: item.start, title: `${T.nap} · ${dur(log)}`, meta: `${fmtTime(item.start)}–${fmtTime(log.end as number)}`, icon: <CloudMoon size={16} />, log });
      else if (item.status === 'ongoing' && log) rows.push({ key: `n${i}`, at: item.start, title: T.napOngoing, meta: dur(log), icon: <CloudMoon size={16} />, log });
      else if (item.status === 'missed') rows.push({ key: `n${i}`, at: item.start, title: T.napMissed, icon: <CloudMoon size={16} />, variant: 'missed' });
      else rows.push({ key: `n${i}`, at: item.start, title: item === nextPlanned ? T.napPlanned : T.napPlannedLater, meta: item.end ? `${fmtTime(item.start)}–${fmtTime(item.end)}` : undefined, icon: <CloudMoon size={16} />, variant: 'planned' });
    } else if (log) {
      rows.push({ key: 'bed', at: item.start, title: log.end === null ? T.nightOngoing : T.bedtime, meta: dur(log), icon: <Moon size={16} />, log });
    } else {
      rows.push({ key: 'bed', at: item.start, title: T.bedtimePlanned, icon: <BedDouble size={16} />, variant: 'planned' });
    }
  });

  childLogs
    .filter((l) => l.type === 'waking' && planDayKey(l.start) === plan.day)
    .forEach((l) => rows.push({ key: l.id, at: l.start, title: T.waking, meta: dur(l), icon: <Baby size={16} />, log: l }));

  rows.sort((a, b) => a.at - b.at);
  const anyLogged = rows.some((r) => r.log);

  return (
    <section className="card" aria-labelledby="day-title">
      <h2 id="day-title" className="section-title" style={{ margin: '0 0 8px' }}>
        {T.dayTitle}
      </h2>
      {!anyLogged && (
        <div className="tip" style={{ marginTop: 0, marginBottom: 8 }}>
          <div>
            <p style={{ fontWeight: 600 }}>{T.emptyTimeline}</p>
            <p className="muted small">{T.emptyTimelineHint}</p>
          </div>
        </div>
      )}
      <ol className="timeline">
        {rows.map((r) => (
          <li key={r.key} className={`tl-item ${r.variant ?? ''}`}>
            <span className="tl-time">{fmtTime(r.at)}</span>
            <span className="tl-dot" aria-hidden="true">
              {r.icon}
            </span>
            {r.log ? (
              <button type="button" className="tl-body" onClick={() => openSheet({ log: r.log })} aria-label={`${T.edit(r.title)}, ${fmtTime(r.at)}`}>
                <span className="tl-title">{r.title}</span>
                {r.meta && <span className="tl-meta">{r.meta}</span>}
              </button>
            ) : (
              <div className="tl-body">
                <span className="tl-title">{r.title}</span>
                {r.meta && <span className="tl-meta">{r.meta}</span>}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
