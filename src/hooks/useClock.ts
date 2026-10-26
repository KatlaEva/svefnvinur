import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` (aligned to the interval) and when the app becomes visible. */
export function useClock(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: number;
    const tick = () => {
      setNow(Date.now());
      timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 20);
    };
    timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 20);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [intervalMs]);
  return now;
}
