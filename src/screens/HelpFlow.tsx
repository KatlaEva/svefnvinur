import { ArrowLeft, Check, Heart, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { DoctorNote } from '../components/DoctorNote';
import { WaitRing } from '../components/WaitRing';
import { coach } from '../config/coach';
import { disclaimer, helpFlows, safeSleep } from '../content/advice';
import * as store from '../data/store';
import type { HelpFlowId } from '../data/types';
import { is } from '../content/is';
import { MIN } from '../lib/time';

type Phase = 'safe' | 'steps' | 'worked' | 'end' | 'notFit';

export function HelpFlowScreen({ flowId }: { flowId: HelpFlowId }) {
  const { plan, child, go, state, childLogs } = useApp();
  const flow = helpFlows.find((f) => f.id === flowId);
  const youngBaby = plan?.band === '0-3m' || plan?.band === '4-6m';
  const [phase, setPhase] = useState<Phase>(youngBaby ? 'safe' : 'steps');
  const [index, setIndex] = useState(0);
  const adjusted = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // "Missed nap" / "short nap" recalculate the rest of today, once per visit.
  useEffect(() => {
    if (!flow?.adjustsToday || !child || !plan || adjusted.current) return;
    adjusted.current = true;
    const recent = state.adjustments.some(
      (a) => a.childId === child.id && a.day === plan.day && a.kind === flow.adjustsToday && Date.now() - a.at < 30 * MIN,
    );
    if (!recent) store.addAdjustment({ childId: child.id, day: plan.day, kind: flow.adjustsToday, at: Date.now() });
  }, [flow, child, plan, state.adjustments]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, index]);

  if (!flow || !child || !plan) {
    return (
      <div className="flow">
        <button type="button" className="btn btn-secondary" onClick={() => go('help')}>
          {is.common.back}
        </button>
      </div>
    );
  }

  const steps = flow.steps[plan.band];
  const step = steps[index];
  const last = index === steps.length - 1;

  const finish = (result: 'worked' | 'notFit' | 'finished') => {
    store.logOutcome({ childId: child.id, flowId, at: Date.now(), result });
    if (result === 'worked' && flowId === 'nightWaking' && childLogs.some((l) => l.type === 'waking' && l.end === null)) {
      store.stopTimer(child.id, 'waking');
    }
    setPhase(result === 'worked' ? 'worked' : result === 'notFit' ? 'notFit' : 'end');
  };

  const head = (
    <div className="flow-head">
      <button type="button" className="icon-btn" onClick={() => go('help')} aria-label={is.common.back}>
        <ArrowLeft size={22} />
      </button>
      <p className="flow-name">{flow.title}</p>
    </div>
  );

  if (phase === 'safe') {
    return (
      <div className="flow">
        {head}
        <div className="flow-body">
          <ShieldCheck size={40} aria-hidden="true" color="var(--accent-ink)" />
          <h1 className="flow-step-title" tabIndex={-1} ref={headingRef}>
            {is.help.safeSleepIntro}
          </h1>
          <ul className="safe-list">
            {safeSleep.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="flow-actions">
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => setPhase('steps')}>
            {is.help.gotIt}
          </button>
        </div>
      </div>
    );
  }

  if (phase !== 'steps') {
    const content = {
      worked: { icon: <Check size={40} />, title: is.help.workedTitle, text: is.help.workedText },
      end: { icon: <Heart size={40} />, title: is.help.endTitle, text: is.help.endText },
      notFit: { icon: <Heart size={40} />, title: is.help.notFitTitle, text: is.help.notFitText },
    }[phase];
    return (
      <div className="flow">
        {head}
        <div className="flow-body" style={{ justifyContent: 'flex-start', paddingTop: 16 }}>
          <span aria-hidden="true" style={{ color: 'var(--accent-ink)' }}>
            {content.icon}
          </span>
          <h1 className="flow-step-title" tabIndex={-1} ref={headingRef}>
            {content.title}
          </h1>
          <p className="flow-step-text">{content.text}</p>
          {flow.adjustsToday && <p className="notice">{is.help.adjustedToday}</p>}
          <DoctorNote />
          <p className="disclaimer">{disclaimer}</p>
        </div>
        <div className="flow-actions">
          {phase === 'notFit' && (
            <a className="btn btn-secondary btn-block" href={`mailto:${coach.email}?subject=${encodeURIComponent(`Svefnvinur: ${flow.title}`)}`}>
              <Mail size={20} aria-hidden="true" /> {is.help.contactCoach}
            </a>
          )}
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => go('today')}>
            {is.help.backToToday}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flow">
      {head}
      <div className="dots" role="img" aria-label={is.help.step(index + 1, steps.length)}>
        {steps.map((_, i) => (
          <span key={i} className={`dot ${i <= index ? 'on' : ''}`} />
        ))}
      </div>
      <div className="flow-body">
        <p className="muted">{is.help.step(index + 1, steps.length)}</p>
        <h1 className="flow-step-title" tabIndex={-1} ref={headingRef}>
          {step.title}
        </h1>
        <p className="flow-step-text">{step.text}</p>
        {step.waitMinutes && <WaitRing key={index} minutes={step.waitMinutes} />}
      </div>
      <div className="flow-actions">
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => finish('worked')}>
          <Check size={22} aria-hidden="true" /> {is.help.worked}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg btn-block"
          onClick={() => (last ? finish('finished') : setIndex(index + 1))}
        >
          {last ? is.help.finish : is.help.nextStep}
        </button>
        <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => finish('notFit')}>
          {is.help.notFit}
        </button>
      </div>
    </div>
  );
}
