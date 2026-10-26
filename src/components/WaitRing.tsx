import { useEffect, useState } from 'react';
import { is } from '../content/is';
import { useClock } from '../hooks/useClock';
import { fmtTimer } from '../lib/format';

/** "Bíddu í 3 mín" with a ring that empties as time passes. */
export function WaitRing({ minutes }: { minutes: number }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useClock(1000);
  const total = minutes * 60_000;
  const left = startedAt ? Math.max(0, total - (now - startedAt)) : total;
  const done = startedAt !== null && left === 0;

  useEffect(() => {
    if (done) navigator.vibrate?.(200);
  }, [done]);

  const r = 52;
  const c = 2 * Math.PI * r;
  const frac = left / total;

  return (
    <div className="ring-wrap">
      <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={done ? is.help.timerDone : is.help.wait(minutes)}>
        <circle cx="66" cy="66" r={r} fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          style={{ stroke: 'var(--accent-ink)' }}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 66 66)"
        />
        <text x="66" y="74" textAnchor="middle" fontSize="24" fontWeight="600" style={{ fill: 'var(--text)', fontFamily: 'var(--font)' }}>
          {fmtTimer(left)}
        </text>
      </svg>
      {startedAt === null ? (
        <button type="button" className="btn btn-soft" onClick={() => setStartedAt(Date.now())}>
          {is.help.wait(minutes)}
        </button>
      ) : (
        <p className="ring-label" role="status" style={{ fontSize: '1.125rem' }}>
          {done ? is.help.timerDone : is.help.wait(minutes)}
        </p>
      )}
    </div>
  );
}
