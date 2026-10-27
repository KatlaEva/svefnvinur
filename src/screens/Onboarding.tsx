import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { AgePreview, birthError, GoalPicker, PrematureFields } from '../components/ChildFields';
import { disclaimer } from '../content/advice';
import { is } from '../content/is';
import { addChild, replaceDemoData } from '../data/store';
import { buildDemo } from '../lib/seed';
import type { Goal } from '../data/types';
import { dateKey } from '../lib/time';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [premature, setPremature] = useState(false);
  const [weeksEarly, setWeeksEarly] = useState(4);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [goal, setGoal] = useState<Goal>('fewerWakings');
  const [touched, setTouched] = useState(false);
  const now = Date.now();
  const O = is.onboarding;

  const error = step === 0 ? (name.trim() ? null : O.errors.name) : step === 1 ? birthError(birthDate, now) : null;

  const next = () => {
    setTouched(true);
    if (error) return;
    setTouched(false);
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    addChild({ name: name.trim(), birthDate, premature, weeksEarly: premature ? weeksEarly : 0, wakeTime, goal });
  };

  return (
    <form
      className="onboarding"
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      noValidate
    >
      <div className="dots" aria-label={O.stepOf(step + 1, 3)} role="img">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`dot ${i <= step ? 'on' : ''}`} />
        ))}
      </div>

      <div className="onboarding-body">
        {step === 0 && (
          <>
            <p className="card-label">{O.welcome}</p>
            <h1 className="screen-title" style={{ paddingTop: 0 }}>
              {O.nameTitle}
            </h1>
            <p className="muted">{O.nameHint}</p>
            <label className="field">
              <span className="field-label">{O.nameLabel}</span>
              <input
                className="input"
                value={name}
                autoFocus
                autoComplete="off"
                placeholder={O.namePlaceholder}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </label>
            {import.meta.env.VITE_DEMO && (
              <div className="age-result stack">
                <p>{O.showcaseNote}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    const demo = buildDemo(Date.now());
                    replaceDemoData(demo.children, demo.logs, demo.outcomes);
                  }}
                >
                  {O.showcaseDemo}
                </button>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="screen-title" style={{ paddingTop: 0 }}>
              {O.birthTitle(name.trim())}
            </h1>
            <label className="field">
              <span className="field-label">{O.birthLabel}</span>
              <input className="input" type="date" value={birthDate} max={dateKey(new Date(now))} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <PrematureFields premature={premature} weeksEarly={weeksEarly} onPremature={setPremature} onWeeks={setWeeksEarly} />
            <AgePreview name={name} birthDate={birthDate} premature={premature} weeksEarly={weeksEarly} now={now} />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="screen-title" style={{ paddingTop: 0 }}>
              {O.wakeTitle}
            </h1>
            <label className="field">
              <span className="field-label">{O.wakeLabel}</span>
              <input className="input" type="time" value={wakeTime} onChange={(e) => e.target.value && setWakeTime(e.target.value)} />
            </label>
            <div className="field">
              <span className="field-label">{O.goalLabel}</span>
              <GoalPicker value={goal} onChange={setGoal} />
            </div>
            <p className="disclaimer">{disclaimer}</p>
          </>
        )}

        {touched && error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="onboarding-actions">
        {step > 0 && (
          <button type="button" className="icon-btn" style={{ width: 56, height: 56 }} onClick={() => setStep(step - 1)} aria-label={is.common.back}>
            <ArrowLeft size={22} />
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
          {step < 2 ? is.common.next : O.start}
        </button>
      </div>
    </form>
  );
}
