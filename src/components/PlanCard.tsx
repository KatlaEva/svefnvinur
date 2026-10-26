import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { disclaimer, tips } from '../content/advice';
import { is } from '../content/is';
import { fmtDuration, fmtHoursRange, fmtWindowRange } from '../lib/format';
import { fmtTime, parseDateKey } from '../lib/time';

export function PlanCard() {
  const { plan } = useApp();
  const [open, setOpen] = useState(false);
  if (!plan) return null;
  const { row } = plan;
  const R = is.today.planRows;
  const d = parseDateKey(plan.day);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const bandTips = tips[plan.band];
  const tip = bandTips[dayOfYear % bandTips.length];

  return (
    <section className="card hide-at-night">
      <button type="button" className="disclosure" aria-expanded={open} onClick={() => setOpen(!open)}>
        <h2>{is.today.planTitle}</h2>
        {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        <span className="visually-hidden">{open ? is.today.planHide : is.today.planShow}</span>
      </button>
      {open && (
        <>
          <dl className="plan-rows">
            {plan.hasNaps && (
              <>
                <dt>{R.naps}</dt>
                <dd>{row.napsLabel}</dd>
                <dt>{R.wakeWindows}</dt>
                <dd>{fmtWindowRange(row.wakeWindow)}</dd>
                <dt>{R.napLength}</dt>
                <dd>
                  {fmtDuration(row.napLength[0])}–{fmtDuration(row.napLength[1])}
                </dd>
              </>
            )}
            <dt>{R.totalSleep}</dt>
            <dd>{fmtHoursRange(row.totalSleep)}</dd>
            <dt>{R.bedtime}</dt>
            <dd>
              {row.bedtime[0]}–{row.bedtime[1]}
            </dd>
            <dt>{R.todayBedtime}</dt>
            <dd>{fmtTime(plan.bedtime)}</dd>
          </dl>
          <div className="tip">
            <Lightbulb size={22} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600 }}>{is.today.tipTitle}</p>
              <p>{tip}</p>
            </div>
          </div>
          <p className="disclaimer">{disclaimer}</p>
        </>
      )}
    </section>
  );
}
