import { Stethoscope } from 'lucide-react';
import { doctorNote } from '../content/advice';

const links: Record<string, string> = {
  'Heilsuvera.is': 'https://www.heilsuvera.is',
  '1700': 'tel:1700',
  '112': 'tel:112',
};

/** Turns "Heilsuvera.is", "1700" and "112" in the coach's text into tappable links. */
function linkify(text: string) {
  return text.split(/(Heilsuvera\.is|1700|112)/).map((part, i) =>
    links[part] ? (
      <a key={i} href={links[part]} {...(part.startsWith('H') ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function DoctorNote() {
  return (
    <aside className="doctor" aria-labelledby="doctor-title">
      <h3 id="doctor-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Stethoscope size={20} aria-hidden="true" /> {doctorNote.title}
      </h3>
      <p>{doctorNote.intro}</p>
      <ul>
        {doctorNote.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p>{doctorNote.worried}</p>
      <p>{linkify(doctorNote.heilsuvera)}</p>
      <p>
        <strong>{linkify(doctorNote.emergency)}</strong>
      </p>
    </aside>
  );
}
