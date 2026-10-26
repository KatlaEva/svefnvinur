import { Check, ChevronDown, Moon, Plus, Sun } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { is } from '../content/is';
import { setActiveChild } from '../data/store';
import { computeAge, formatAge, formatAgeShort } from '../lib/age';
import { fmtDayMonth, fmtWeekday } from '../lib/format';
import { BottomSheet } from './BottomSheet';

export function Header() {
  const { state, child, now, theme, toggleTheme, go } = useApp();
  const [switching, setSwitching] = useState(false);
  if (!child) return null;
  const ageOf = (c: typeof child) => computeAge(c.birthDate, now, c.premature, c.weeksEarly);
  const age = ageOf(child);

  return (
    <header className="header">
      <p className="header-date">
        <span>{fmtWeekday(now)}</span>
        <br />
        {fmtDayMonth(now)}
      </p>
      <button
        type="button"
        className="child-pill"
        onClick={() => setSwitching(true)}
        aria-label={`${child.name}, ${formatAge(age)}. ${is.header.switchChild}`}
      >
        <span className="name">{child.name}</span>
        <span className="age-pill">{formatAgeShort(age)}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-pressed={theme === 'night'}
        aria-label={theme === 'night' ? is.header.nightOff : is.header.nightOn}
        onClick={toggleTheme}
      >
        {theme === 'night' ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {switching && (
        <BottomSheet title={is.header.children} onClose={() => setSwitching(false)}>
          <ul className="list">
            {state.children.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="option-card"
                  role="radio"
                  aria-checked={c.id === child.id}
                  style={{ marginBottom: 8 }}
                  onClick={() => {
                    setActiveChild(c.id);
                    setSwitching(false);
                  }}
                >
                  <span className="grow" style={{ flex: 1 }}>
                    {c.name} <span className="muted">· {formatAge(ageOf(c))}</span>
                  </span>
                  {c.id === child.id && <Check size={20} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              setSwitching(false);
              go('more');
            }}
          >
            <Plus size={20} aria-hidden="true" /> {is.header.addChild}
          </button>
        </BottomSheet>
      )}
    </header>
  );
}
