import type { ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  /** chips can be unselected again; segmented always has a value */
  variant?: 'segmented' | 'chips';
}

/** Radio group rendered as a segmented control or chips. */
export function Choice<T extends string>({ label, options, value, onChange, variant = 'chips' }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={variant === 'segmented' ? 'segmented' : 'chips'}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={variant === 'chips' ? 'chip' : undefined}
          onClick={() => onChange(variant === 'chips' && value === o.value ? undefined : o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className="switch-hit" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
      <span className="switch" data-on={checked} />
    </button>
  );
}
