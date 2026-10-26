import { BarChart3, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { BarChart, type BarDatum } from '../components/BarChart';
import { Choice } from '../components/Choice';
import { EmptyState } from '../components/EmptyState';
import { is } from '../content/is';
import { fmtDuration, fmtNumber } from '../lib/format';
import { averages, insight, loggedDayCount, summarizeDays, type Insight } from '../lib/progress';
import { minutesToClock, parseDateKey, planDayKey } from '../lib/time';

type Range = 'week' | 'month';

function insightText(ins: Insight, name: string): string {
  const P = is.progress.insights;
  const n = (v: number) => fmtNumber(v, Math.abs(Math.round(v) - v) < 0.25 ? 0 : 1);
  switch (ins.kind) {
    case 'wakingsDown':
      return P.wakingsDown(n(ins.from), n(ins.to));
    case 'wakingsUp':
      return P.wakingsUp(n(ins.from), n(ins.to));
    case 'totalUp':
      return P.totalUp(fmtDuration(ins.minutes));
    case 'asleepEarlier':
      return P.asleepEarlier(fmtDuration(ins.minutes));
    case 'average':
      return `${P.average(name, fmtDuration(ins.total))} ${ins.inRange === true ? P.inRange : ins.inRange === false ? P.outOfRange : ''}`.trim();
  }
}

export function ProgressScreen() {
  const { state, child, now, plan, openSheet } = useApp();
  const [range, setRange] = useState<Range>('week');
  const today = planDayKey(now);
  const P = is.progress;

  // Today only joins the charts once tonight's sleep is logged; a half day would look like a bad day.
  const allDays = useMemo(() => {
    if (!child) return [];
    const withToday = summarizeDays(state.logs, child.id, today, 61);
    return withToday.at(-1)?.nightStart !== undefined ? withToday.slice(1) : withToday.slice(0, -1);
  }, [state.logs, child, today]);
  const todayLogged = useMemo(
    () => (child ? state.logs.some((l) => l.childId === child.id && planDayKey(l.start) === today) : false),
    [state.logs, child, today],
  );
  const days = allDays.slice(range === 'week' ? -7 : -30);
  const logged = loggedDayCount(allDays) + (todayLogged && allDays.at(-1)?.day !== today ? 1 : 0);

  if (!child || !plan) return null;

  if (logged < 3) {
    return (
      <div className="screen">
        <h1 className="screen-title">{P.title}</h1>
        <EmptyState
          icon={<BarChart3 size={28} />}
          title={P.emptyTitle}
          text={P.emptyText(logged)}
          action={
            <button type="button" className="btn btn-primary" onClick={() => openSheet()}>
              <Plus size={20} aria-hidden="true" /> {is.today.logSleep}
            </button>
          }
        />
      </div>
    );
  }

  const avg = averages(days);
  const ins = insight(days, plan.row.totalSleep);
  const dayLabel = (key: string) => {
    const d = parseDateKey(key);
    return range === 'week' ? is.weekdaysShort[d.getDay()] : String(d.getDate());
  };
  const fullLabel = (key: string) => {
    const d = parseDateKey(key);
    return `${is.weekdaysShort[d.getDay()]} ${d.getDate()}.`;
  };
  // CSS variables, so the chart follows the day/night theme
  const cNight = 'var(--chart-night)';
  const cNap = 'var(--chart-nap)';

  const maxWakings = Math.max(3, ...days.map((d) => d.wakings));
  const wakingData: BarDatum[] = days.map((d) => ({
    label: dayLabel(d.day),
    segments: d.nightStart !== undefined ? [{ value: Math.max(d.wakings, 0.08), color: cNight }] : [],
    tooltip: d.nightStart !== undefined ? P.tooltipWakings(d.wakings) : P.noNight,
  }));

  const [lo, hi] = plan.row.totalSleep;
  const maxSleep = Math.max(hi + 2, ...days.map((d) => Math.ceil(d.totalMinutes / 60) + 1)) * 60;
  const sleepData: BarDatum[] = days.map((d) => ({
    label: dayLabel(d.day),
    segments: d.hasData ? [{ value: d.nightMinutes, color: cNight }, { value: d.napMinutes, color: cNap }] : [],
    tooltip: d.hasData ? `${fmtDuration(d.totalMinutes)} (${P.night.toLowerCase()} ${fmtDuration(d.nightMinutes)}, ${P.naps.toLowerCase()} ${fmtDuration(d.napMinutes)})` : is.common.notLogged,
  }));

  const stat = (label: string, value: string | undefined) => (
    <div className="stat" key={label}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${value ? '' : 'missing'}`}>{value ?? is.common.notLogged}</span>
    </div>
  );
  const clock = (m?: number) => (m === undefined ? undefined : minutesToClock(m));
  const dur = (m?: number) => (m === undefined ? undefined : fmtDuration(m));

  return (
    <div className="screen">
      <h1 className="screen-title">{P.title}</h1>
      <Choice<Range>
        label={P.title}
        variant="segmented"
        value={range}
        onChange={(v) => v && setRange(v)}
        options={[
          { value: 'week', label: P.week },
          { value: 'month', label: P.month },
        ]}
      />

      {ins && (
        <section className="card tinted insight" aria-label={P.insightTitle}>
          <Sparkles size={24} aria-hidden="true" style={{ flex: 'none', color: 'var(--accent-ink)' }} />
          <p>{insightText(ins, child.name)}</p>
        </section>
      )}

      <section className="card">
        <h2 className="section-title" style={{ margin: '0 0 8px' }}>
          {P.wakingsChart}
        </h2>
        <BarChart
          title={P.wakingsChart}
          data={wakingData}
          max={maxWakings}
          ticks={Array.from({ length: maxWakings + 1 }, (_, i) => i).filter((t) => maxWakings <= 5 || t % 2 === 0)}
          tickLabel={(v) => String(v)}
          tableHead={['Dagur', P.wakingsChart]}
          tableRows={days.map((d) => [fullLabel(d.day), d.nightStart !== undefined ? String(d.wakings) : is.common.notLogged])}
        />
      </section>

      <section className="card">
        <h2 className="section-title" style={{ margin: '0 0 8px' }}>
          {P.sleepChart}
        </h2>
        <BarChart
          title={P.sleepChart}
          data={sleepData}
          max={maxSleep}
          band={[lo * 60, hi * 60]}
          ticks={[0, 4, 8, 12, 16].filter((h) => h * 60 <= maxSleep).map((h) => h * 60)}
          tickLabel={(v) => `${v / 60}`}
          tableHead={['Dagur', P.night, P.naps, P.avg.total]}
          tableRows={days.map((d) =>
            d.hasData ? [fullLabel(d.day), fmtDuration(d.nightMinutes), fmtDuration(d.napMinutes), fmtDuration(d.totalMinutes)] : [fullLabel(d.day), is.common.notLogged, '', ''],
          )}
        />
        <div className="legend">
          <span>
            <i className="swatch" style={{ background: cNight }} /> {P.night}
          </span>
          <span>
            <i className="swatch" style={{ background: cNap }} /> {P.naps}
          </span>
          <span>
            <i className="swatch" style={{ background: 'var(--chart-range)', outline: '1px solid var(--border)' }} /> {P.range(lo, hi)}
          </span>
        </div>
      </section>

      <h2 className="section-title">{P.averagesTitle}</h2>
      <div className="grid-6">
        {stat(P.avg.inBed, clock(avg.inBed))}
        {stat(P.avg.asleep, clock(avg.asleep))}
        {stat(P.avg.wake, clock(avg.wake))}
        {stat(P.avg.night, dur(avg.night))}
        {stat(P.avg.naps, plan.hasNaps || avg.naps ? dur(avg.naps) : undefined)}
        {stat(P.avg.total, dur(avg.total))}
      </div>
    </div>
  );
}
