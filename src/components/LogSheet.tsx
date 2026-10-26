import { Play, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { is } from '../content/is';
import * as store from '../data/store';
import type { Ease, Place, SleepType } from '../data/types';
import { fmtDuration } from '../lib/format';
import { DAY, fmtTime, HOUR, MIN, roundToMinute } from '../lib/time';
import { BottomSheet, ConfirmSheet } from './BottomSheet';
import { Choice } from './Choice';

/** Puts "HH:MM" on whichever of yesterday / today / tomorrow is closest to the reference moment. */
export function clockNear(hhmm: string, reference: number): number {
  const [h, m] = hhmm.split(':').map(Number);
  const base = new Date(reference);
  base.setHours(h, m, 0, 0);
  const candidates = [base.getTime() - DAY, base.getTime(), base.getTime() + DAY];
  return candidates.reduce((best, c) => (Math.abs(c - reference) < Math.abs(best - reference) ? c : best));
}

function TimeField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        <div className="time-row" style={{ marginTop: 6 }}>
          <input
            className="input"
            type="time"
            value={fmtTime(value)}
            onChange={(e) => e.target.value && onChange(clockNear(e.target.value, value))}
          />
          <button type="button" className="step-btn" onClick={() => onChange(value - 5 * MIN)} aria-label={`${label} ${is.common.minus5}`}>
            {is.common.minus5}
          </button>
          <button type="button" className="step-btn" onClick={() => onChange(value + 5 * MIN)} aria-label={`${label} ${is.common.plus5}`}>
            {is.common.plus5}
          </button>
        </div>
      </label>
    </div>
  );
}

export function LogSheet() {
  const { sheet, closeSheet, child, nowState, plan, toast } = useApp();
  const editing = sheet?.log;
  const now = roundToMinute(Date.now());

  const defaultType = (): SleepType => {
    if (editing) return editing.type;
    if (sheet?.preset) return sheet.preset.type;
    if (nowState?.kind === 'night' || nowState?.kind === 'nightWaking') return nowState.since ? 'waking' : 'night';
    if (nowState?.kind === 'routine' || !plan?.hasNaps) return 'night';
    return 'nap';
  };

  const [type, setType] = useState<SleepType>(defaultType);
  const [start, setStart] = useState<number>(editing?.start ?? sheet?.preset?.start ?? now);
  const [end, setEnd] = useState<number | null>(editing ? editing.end : (sheet?.preset?.end ?? null));
  const [inBed, setInBed] = useState<number | undefined>(editing?.inBed);
  const [ease, setEase] = useState<Ease | undefined>(editing?.ease);
  const [place, setPlace] = useState<Place | undefined>(editing?.place);
  const [note, setNote] = useState(editing?.note ?? '');
  const [showNote, setShowNote] = useState(Boolean(editing?.note));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const error = useMemo(() => {
    const limit = Date.now() + MIN;
    if (start > limit || (end !== null && end > limit)) return is.sheet.errors.future;
    if (end !== null && end <= start) return is.sheet.errors.endBeforeStart;
    if (end !== null && end - start > 16 * HOUR) return is.sheet.errors.tooLong;
    return null;
  }, [start, end]);

  if (!child) return null;

  const save = () => {
    if (error) return;
    const data = {
      type,
      start,
      end,
      inBed: type === 'night' ? inBed : undefined,
      ease: type === 'waking' ? undefined : ease,
      place: type === 'waking' ? undefined : place,
      note: note.trim() || undefined,
    };
    if (editing) store.updateLog(editing.id, data);
    else store.addLog({ childId: child.id, ...data });
    toast(is.sheet.saved);
    closeSheet();
  };

  const durationMin = end !== null ? (end - start) / MIN : null;

  return (
    <>
      <BottomSheet title={editing ? is.sheet.editTitle : is.sheet.title} onClose={closeSheet}>
        <div className="stack" style={{ gap: 18 }}>
          <Choice<SleepType>
            label={is.sheet.type}
            variant="segmented"
            value={type}
            onChange={(v) => v && setType(v)}
            options={(['nap', 'night', 'waking'] as const).map((v) => ({ value: v, label: is.sheet.types[v] }))}
          />

          <TimeField label={is.sheet.start(type)} value={start} onChange={setStart} />

          {end === null ? (
            <div className="field">
              <span className="field-label">{is.sheet.end(type)}</span>
              <button type="button" className="end-placeholder" onClick={() => setEnd(Math.max(now, start + MIN))}>
                {type === 'waking' ? is.sheet.notYetAwake : is.sheet.notYet}. <u>{is.sheet.setEndNow}</u>
              </button>
            </div>
          ) : (
            <div>
              <TimeField label={is.sheet.end(type)} value={end} onChange={setEnd} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {durationMin !== null && durationMin > 0 && <span className="muted">{is.sheet.duration(fmtDuration(durationMin))}</span>}
                <button type="button" className="link-btn" onClick={() => setEnd(null)}>
                  {type === 'waking' ? is.sheet.notYetAwake : is.sheet.notYet}
                </button>
              </div>
            </div>
          )}

          {type === 'night' &&
            (inBed === undefined ? (
              <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setInBed(start - 10 * MIN)}>
                + {is.sheet.inBed}
              </button>
            ) : (
              <TimeField label={is.sheet.inBed} value={inBed} onChange={setInBed} />
            ))}

          {type !== 'waking' && (
            <>
              <div className="field">
                <span className="field-label">{is.sheet.ease}</span>
                <Choice<Ease>
                  label={is.sheet.ease}
                  value={ease}
                  onChange={setEase}
                  options={(['easy', 'some', 'hard'] as const).map((v) => ({ value: v, label: is.sheet.eases[v] }))}
                />
              </div>
              <div className="field">
                <span className="field-label">{is.sheet.place}</span>
                <Choice<Place>
                  label={is.sheet.place}
                  value={place}
                  onChange={setPlace}
                  options={(['bed', 'stroller', 'car', 'arms'] as const).map((v) => ({ value: v, label: is.sheet.places[v] }))}
                />
              </div>
            </>
          )}

          {showNote ? (
            <label className="field">
              <span className="field-label">{is.sheet.note}</span>
              <textarea className="input" value={note} placeholder={is.sheet.notePlaceholder} onChange={(e) => setNote(e.target.value)} />
            </label>
          ) : (
            <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowNote(true)}>
              + {is.sheet.addNote}
            </button>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={save} disabled={Boolean(error)}>
            {end === null && <Play size={20} aria-hidden="true" />}
            {end === null ? (type === 'waking' ? is.sheet.stillAwake : is.sheet.stillSleeping) : is.common.save}
          </button>
          {editing && (
            <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={20} aria-hidden="true" /> {is.common.delete}
            </button>
          )}
        </div>
      </BottomSheet>
      {confirmDelete && editing && (
        <ConfirmSheet
          title={is.common.delete}
          text={is.sheet.deleteConfirm}
          confirmLabel={is.common.delete}
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            store.deleteLog(editing.id);
            setConfirmDelete(false);
            closeSheet();
          }}
        />
      )}
    </>
  );
}
