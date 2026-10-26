import { LifeBuoy, Plus } from 'lucide-react';
import { useApp } from '../AppContext';
import { is } from '../content/is';
import { removeAdjustment } from '../data/store';
import { NowCard } from '../components/NowCard';
import { PlanCard } from '../components/PlanCard';
import { Timeline } from '../components/Timeline';

export function TodayScreen() {
  const { openSheet, go, plan, state, child } = useApp();
  const todaysAdjustments = plan && child ? state.adjustments.filter((a) => a.childId === child.id && a.day === plan.day) : [];

  return (
    <div className="screen" style={{ paddingTop: 4 }}>
      <NowCard />

      {plan && plan.bedtimeShift > 0 && todaysAdjustments.length > 0 && (
        <div className="notice" role="status">
          <p>{is.today.adjusted(plan.bedtimeShift)}</p>
          <button type="button" className="link-btn" onClick={() => todaysAdjustments.forEach((a) => removeAdjustment(a.id))}>
            {is.today.undoAdjust}
          </button>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn btn-soft btn-lg" onClick={() => openSheet()}>
          <Plus size={22} aria-hidden="true" /> {is.today.logSleep}
        </button>
        <button type="button" className="btn btn-help btn-lg" onClick={() => go('help')}>
          <LifeBuoy size={22} aria-hidden="true" /> {is.today.helpNow}
        </button>
      </div>

      <Timeline />
      <PlanCard />
    </div>
  );
}
