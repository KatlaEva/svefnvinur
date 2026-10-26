import { Minus, Plus } from 'lucide-react';
import { is } from '../content/is';
import type { Goal } from '../data/types';
import { computeAge, formatAge, scheduleFor, validateBirthDate } from '../lib/age';
import { fmtWindowRange } from '../lib/format';

export const goals: Goal[] = ['fewerWakings', 'easierFallingAsleep', 'longerNaps', 'laterMornings'];

export function birthError(birthDate: string, now: number): string | null {
  const e = validateBirthDate(birthDate, now);
  return e ? is.onboarding.errors[e] : null;
}

/** Shows "Theódór er 14 mánaða" and a one-line summary of the plan for that age. */
export function AgePreview(props: { name: string; birthDate: string; premature: boolean; weeksEarly: number; now: number }) {
  const { name, birthDate, premature, weeksEarly, now } = props;
  if (validateBirthDate(birthDate, now)) return null;
  const age = computeAge(birthDate, now, premature, weeksEarly);
  const row = scheduleFor(age.months);
  return (
    <div className="age-result" role="status">
      <strong>{is.onboarding.ageLine(name.trim() || 'Barnið', formatAge(age))}</strong>
      <p>
        {row.naps > 0
          ? is.planLine.naps(row.napsLabel, fmtWindowRange(row.wakeWindow), row.bedtime[0], row.bedtime[1])
          : is.planLine.noNaps(row.bedtime[0], row.bedtime[1])}
      </p>
      {age.corrected && <p className="muted small">{is.onboarding.correctedNote}</p>}
    </div>
  );
}

export function PrematureFields(props: {
  premature: boolean;
  weeksEarly: number;
  onPremature: (v: boolean) => void;
  onWeeks: (v: number) => void;
}) {
  const { premature, weeksEarly, onPremature, onWeeks } = props;
  return (
    <>
      <label className="checkbox-row">
        <input type="checkbox" checked={premature} onChange={(e) => onPremature(e.target.checked)} />
        {is.onboarding.premature}
      </label>
      {premature && (
        <div className="field">
          <span className="field-label" id="weeks-label">
            {is.onboarding.weeksEarly}
          </span>
          <div className="stepper" role="group" aria-labelledby="weeks-label">
            <button type="button" className="icon-btn" aria-label="Færri vikur" onClick={() => onWeeks(Math.max(1, weeksEarly - 1))}>
              <Minus size={20} />
            </button>
            <output aria-live="polite">{is.onboarding.weeksUnit(weeksEarly)}</output>
            <button type="button" className="icon-btn" aria-label="Fleiri vikur" onClick={() => onWeeks(Math.min(17, weeksEarly + 1))}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function GoalPicker({ value, onChange }: { value: Goal; onChange: (g: Goal) => void }) {
  return (
    <div role="radiogroup" aria-label={is.onboarding.goalLabel} className="stack" style={{ gap: 8 }}>
      {goals.map((g) => (
        <button key={g} type="button" role="radio" aria-checked={value === g} className="option-card" onClick={() => onChange(g)}>
          {is.goals[g]}
        </button>
      ))}
    </div>
  );
}
