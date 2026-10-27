import { ArrowUp, CalendarDays, ChevronDown, ChevronUp, Download, Mail, Pencil, Phone, Plus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { BottomSheet, ConfirmSheet } from '../components/BottomSheet';
import { AgePreview, birthError, GoalPicker, PrematureFields } from '../components/ChildFields';
import { Choice, Switch } from '../components/Choice';
import { coach } from '../config/coach';
import { disclaimer, rules } from '../content/advice';
import { is } from '../content/is';
import * as store from '../data/store';
import type { Child, Goal, NightModeSetting } from '../data/types';
import { computeAge, formatAge } from '../lib/age';
import { buildDemo } from '../lib/seed';
import { dateKey } from '../lib/time';

const M = is.more;

function ChildFormSheet({ child, onClose }: { child?: Child; onClose: () => void }) {
  const now = Date.now();
  const [name, setName] = useState(child?.name ?? '');
  const [birthDate, setBirthDate] = useState(child?.birthDate ?? '');
  const [premature, setPremature] = useState(child?.premature ?? false);
  const [weeksEarly, setWeeksEarly] = useState(child?.weeksEarly || 4);
  const [wakeTime, setWakeTime] = useState(child?.wakeTime ?? '07:00');
  const [goal, setGoal] = useState<Goal>(child?.goal ?? 'fewerWakings');
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const error = name.trim() ? birthError(birthDate, now) : is.onboarding.errors.name;

  const save = () => {
    setTouched(true);
    if (error) return;
    const data = { name: name.trim(), birthDate, premature, weeksEarly: premature ? weeksEarly : 0, wakeTime, goal };
    if (child) store.updateChild(child.id, data);
    else store.addChild(data);
    onClose();
  };

  return (
    <>
      <BottomSheet title={child ? M.editChild : M.addChild} onClose={onClose}>
        <div className="stack" style={{ gap: 18 }}>
          <label className="field">
            <span className="field-label">{is.childForm.name}</span>
            <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">{is.childForm.birth}</span>
            <input className="input" type="date" value={birthDate} max={dateKey(new Date(now))} onChange={(e) => setBirthDate(e.target.value)} />
          </label>
          <PrematureFields premature={premature} weeksEarly={weeksEarly} onPremature={setPremature} onWeeks={setWeeksEarly} />
          <AgePreview name={name} birthDate={birthDate} premature={premature} weeksEarly={weeksEarly} now={now} />
          <label className="field">
            <span className="field-label">{is.childForm.wake}</span>
            <input className="input" type="time" value={wakeTime} onChange={(e) => e.target.value && setWakeTime(e.target.value)} />
          </label>
          <div className="field">
            <span className="field-label">{is.childForm.goal}</span>
            <GoalPicker value={goal} onChange={setGoal} />
          </div>
          {touched && error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}>
            {is.common.save}
          </button>
          {child && (
            <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={20} aria-hidden="true" /> {M.deleteChild}
            </button>
          )}
        </div>
      </BottomSheet>
      {confirmDelete && child && (
        <ConfirmSheet
          title={M.deleteChild}
          text={M.deleteChildConfirm(child.name)}
          confirmLabel={is.common.delete}
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            store.deleteChild(child.id);
            onClose();
          }}
        />
      )}
    </>
  );
}

function RoutineEditor() {
  const { state } = useApp();
  const [draft, setDraft] = useState('');
  const items = state.settings.routine;
  const set = (routine: string[]) => store.updateSettings({ routine });
  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    set([...items, v]);
    setDraft('');
  };
  return (
    <div className="stack">
      <div>
        <p style={{ fontWeight: 600 }}>{M.routine}</p>
        <p className="muted small">{M.routineHint}</p>
      </div>
      <ul className="list">
        {items.map((item, i) => (
          <li key={item} className="list-item" style={{ minHeight: 52 }}>
            <span className="grow">{item}</span>
            {i > 0 && (
              <button
                type="button"
                className="icon-btn"
                aria-label={M.routineUp(item)}
                onClick={() => {
                  const next = [...items];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set(next);
                }}
              >
                <ArrowUp size={20} />
              </button>
            )}
            <button type="button" className="icon-btn" aria-label={M.routineRemove(item)} onClick={() => set(items.filter((x) => x !== item))}>
              <X size={20} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="input" style={{ flex: 3 }} value={draft} maxLength={30} placeholder={M.routineAdd} aria-label={M.routineAdd} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="btn btn-secondary" style={{ flex: 'none' }} aria-label={M.routineAdd}>
          <Plus size={20} aria-hidden="true" /> {is.common.add}
        </button>
      </form>
    </div>
  );
}

const showDev = (() => {
  try {
    if (new URLSearchParams(location.search).has('dev')) localStorage.setItem('svefnvinur:dev', '1');
    return import.meta.env.DEV || Boolean(import.meta.env.VITE_SHOWCASE) || localStorage.getItem('svefnvinur:dev') === '1';
  } catch {
    return import.meta.env.DEV;
  }
})();

export function MoreScreen() {
  const { state, now, toast } = useApp();
  const [editing, setEditing] = useState<Child | 'new' | null>(null);
  const [wipeStep, setWipeStep] = useState(0);
  const [importJson, setImportJson] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const notifSupported = typeof Notification !== 'undefined';
  const notifDenied = notifSupported && Notification.permission === 'denied';

  const exportData = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `svefnvinur-${dateKey(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toggleNotifications = async (on: boolean) => {
    if (!on) {
      store.updateSettings({ notifications: false });
      return;
    }
    if (!notifSupported) return;
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    store.updateSettings({ notifications: permission === 'granted' });
    if (permission !== 'granted') toast(M.notificationsDenied);
  };

  return (
    <div className="screen">
      <h1 className="screen-title">{M.title}</h1>

      {/* Children */}
      <section className="card" aria-labelledby="children-title">
        <h2 id="children-title" className="section-title" style={{ margin: 0 }}>
          {M.children}
        </h2>
        <ul className="list">
          {state.children.map((c) => (
            <li key={c.id} className="list-item">
              <div className="grow">
                <p style={{ fontWeight: 600 }}>{c.name}</p>
                <p className="muted small">
                  {formatAge(computeAge(c.birthDate, now, c.premature, c.weeksEarly))} · {is.goals[c.goal]}
                </p>
              </div>
              <button type="button" className="icon-btn" aria-label={`${is.common.edit}: ${c.name}`} onClick={() => setEditing(c)}>
                <Pencil size={20} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setEditing('new')}>
          <Plus size={20} aria-hidden="true" /> {M.addChild}
        </button>
      </section>

      {/* Coach */}
      <section className="card" aria-labelledby="coach-title">
        <h2 id="coach-title" className="section-title" style={{ margin: '0 0 12px' }}>
          {M.coach}
        </h2>
        <div className="coach">
          <img src={coach.photo} alt="" />
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>{coach.name}</p>
            <p className="muted small">{coach.title}</p>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>{coach.bio}</p>
        <div className="coach-actions">
          <a className="btn btn-soft" href={`mailto:${coach.email}`}>
            <Mail size={20} aria-hidden="true" />
            {M.email}
          </a>
          <a className="btn btn-soft" href={`tel:${coach.phone.replace(/\s/g, '')}`}>
            <Phone size={20} aria-hidden="true" />
            {M.phone}
          </a>
          <a className="btn btn-soft" href={coach.bookingUrl} target="_blank" rel="noreferrer">
            <CalendarDays size={20} aria-hidden="true" />
            {M.book}
          </a>
        </div>
      </section>

      {/* Settings */}
      <section className="card stack" aria-labelledby="settings-title" style={{ gap: 16 }}>
        <h2 id="settings-title" className="section-title" style={{ margin: 0 }}>
          {M.settings}
        </h2>
        <div>
          <div className="switch-row">
            <span style={{ fontWeight: 600 }}>{M.notifications}</span>
            <Switch label={M.notifications} checked={state.settings.notifications} onChange={toggleNotifications} />
          </div>
          <p className="muted small">
            {!notifSupported ? M.notificationsUnsupported : notifDenied ? M.notificationsDenied : M.notificationsHint(rules.reminderBeforeRoutine)}
          </p>
        </div>
        <div className="field">
          <span className="field-label">{M.nightMode}</span>
          <Choice<NightModeSetting>
            label={M.nightMode}
            variant="segmented"
            value={state.settings.nightMode}
            onChange={(v) => {
              if (!v) return;
              store.updateSettings({ nightMode: v });
              store.setThemeOverride(null);
            }}
            options={(['auto', 'always', 'never'] as const).map((v) => ({ value: v, label: M.nightModes[v] }))}
          />
          <p className="muted small">{M.nightModeHint}</p>
        </div>
        <RoutineEditor />
      </section>

      {/* Privacy & data */}
      <section className="card stack" aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="section-title" style={{ margin: 0 }}>
          {M.privacy}
        </h2>
        <p>{M.privacyText}</p>
        {!import.meta.env.VITE_SHOWCASE && (
          <button type="button" className="btn btn-secondary btn-block" onClick={exportData}>
            <Download size={20} aria-hidden="true" /> {M.export}
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
          <Upload size={20} aria-hidden="true" /> {M.import}
        </button>
        <p className="muted small">{M.importHint}</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const text = await file.text();
            try {
              store.migrate(JSON.parse(text));
              setImportJson(text);
            } catch {
              toast(M.importError);
            }
          }}
        />
        <button type="button" className="btn btn-danger btn-block" onClick={() => setWipeStep(1)}>
          <Trash2 size={20} aria-hidden="true" /> {M.wipe}
        </button>
      </section>

      {/* Terms */}
      <section className="card">
        <button type="button" className="disclosure" aria-expanded={termsOpen} onClick={() => setTermsOpen(!termsOpen)}>
          <h2>{M.terms}</h2>
          {termsOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
        {termsOpen && <p style={{ marginTop: 8 }}>{M.termsText}</p>}
      </section>

      {showDev && (
        <section className="card" aria-labelledby="dev-title">
          <h2 id="dev-title" className="section-title" style={{ margin: 0 }}>
            {M.dev}
          </h2>
          <div className="switch-row">
            <div>
              <p style={{ fontWeight: 600 }}>{M.demo}</p>
              <p className="muted small">{M.demoHint}</p>
            </div>
            <Switch
              label={M.demo}
              checked={state.settings.demo}
              onChange={(on) => {
                if (on) {
                  const demo = buildDemo(Date.now());
                  store.replaceDemoData(demo.children, demo.logs, demo.outcomes);
                } else store.replaceDemoData([], [], []);
              }}
            />
          </div>
        </section>
      )}

      <p className="disclaimer" style={{ textAlign: 'center' }}>
        {disclaimer}
        <br />
        {M.version(__APP_VERSION__)}
      </p>

      {editing && <ChildFormSheet child={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}

      {importJson && (
        <ConfirmSheet
          title={M.import}
          text={M.importConfirm}
          confirmLabel={M.import}
          onCancel={() => setImportJson(null)}
          onConfirm={() => {
            try {
              store.importData(importJson);
              toast(M.importDone);
            } catch {
              toast(M.importError);
            }
            setImportJson(null);
          }}
        />
      )}

      {wipeStep === 1 && (
        <ConfirmSheet title={M.wipe} text={M.wipeConfirm1} confirmLabel={is.common.next} danger onCancel={() => setWipeStep(0)} onConfirm={() => setWipeStep(2)} />
      )}
      {wipeStep === 2 && (
        <ConfirmSheet
          title={M.wipe}
          text={M.wipeConfirm2}
          confirmLabel={M.wipeYes}
          danger
          onCancel={() => setWipeStep(0)}
          onConfirm={() => {
            setWipeStep(0);
            store.clearAll();
          }}
        />
      )}
    </div>
  );
}
