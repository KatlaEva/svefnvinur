import { BedDouble, CalendarX, ChevronRight, Hourglass, Moon, Sunrise } from 'lucide-react';
import { useApp } from '../AppContext';
import { ageBands, disclaimer, helpFlows } from '../content/advice';
import { is } from '../content/is';
import type { HelpFlowId } from '../data/types';
import { DoctorNote } from '../components/DoctorNote';

export const flowIcons: Record<HelpFlowId, typeof Moon> = {
  nightWaking: Moon,
  wontSleep: BedDouble,
  shortNap: Hourglass,
  missedNap: CalendarX,
  earlyWaking: Sunrise,
};

export function HelpScreen() {
  const { go, plan, child } = useApp();
  const band = ageBands.find((b) => b.id === plan?.band);
  const flows = helpFlows.filter((f) => plan?.hasNaps || (f.id !== 'shortNap' && f.id !== 'missedNap'));

  return (
    <div className="screen">
      <h1 className="screen-title">{is.help.title}</h1>
      <p className="screen-lead">{is.help.intro}</p>
      {child && band && <p className="muted small">{is.help.for(child.name, band.label)}</p>}
      <ul className="help-list">
        {flows.map((f) => {
          const Icon = flowIcons[f.id];
          return (
            <li key={f.id}>
              <button type="button" className="help-item" onClick={() => go('help', f.id)}>
                <span className="hi-icon" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <span style={{ flex: 1 }}>
                  <span className="hi-title">{f.title}</span>
                  <span className="hi-sub">{f.subtitle}</span>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="hide-at-night">
        <DoctorNote />
      </div>
      <p className="disclaimer">{disclaimer}</p>
    </div>
  );
}
