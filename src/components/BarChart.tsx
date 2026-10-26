import { useState } from 'react';

export interface BarDatum {
  label: string;
  /** stacked bottom → top; empty array = no data that day */
  segments: { value: number; color: string }[];
  tooltip: string;
}

interface Props {
  title: string;
  data: BarDatum[];
  max: number;
  ticks: number[];
  tickLabel: (v: number) => string;
  /** shaded recommended range [low, high] in data units */
  band?: [number, number];
  /** table header cells for the accessible table view */
  tableHead: string[];
  tableRows: string[][];
}

const W = 340;
const H = 170;
const PAD = { top: 10, right: 4, bottom: 22, left: 34 };

/** Thin baseline-anchored bars with rounded data ends, 2px gaps between stacked segments, and tap/hover tooltips. */
export function BarChart({ title, data, max, ticks, tickLabel, band, tableHead, tableRows }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.max(4, Math.min(22, slot * 0.6));
  const y = (v: number) => PAD.top + innerH - (Math.min(v, max) / max) * innerH;
  const labelEvery = data.length > 10 ? Math.ceil(data.length / 6) : 1;

  return (
    <div className="chart-wrap" onMouseLeave={() => setActive(null)}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {band && (
          <rect x={PAD.left} width={innerW} y={y(band[1])} height={y(band[0]) - y(band[1])} style={{ fill: 'var(--chart-range)' }} />
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end">
              {tickLabel(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const x = cx - barW / 2;
          let base = PAD.top + innerH;
          const shapes = d.segments
            .filter((s) => s.value > 0)
            .map((s, si, arr) => {
              const h = Math.max(1, (Math.min(s.value, max) / max) * innerH - (si > 0 ? 2 : 0));
              const top = base - h - (si > 0 ? 2 : 0);
              const isTop = si === arr.length - 1;
              const r = isTop ? Math.min(4, barW / 2, h) : 0;
              base = top;
              const path = `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`;
              return <path key={si} d={path} style={{ fill: s.color }} opacity={active === null || active === i ? 1 : 0.55} />;
            });
          return (
            <g key={i}>
              {shapes}
              {d.segments.length === 0 && <line x1={x} x2={x + barW} y1={PAD.top + innerH - 1} y2={PAD.top + innerH - 1} style={{ stroke: 'var(--border)' }} strokeWidth="2" />}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 6} textAnchor="middle">
                  {d.label}
                </text>
              )}
              <rect
                className="bar-hit"
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={innerH + PAD.bottom}
                tabIndex={0}
                aria-label={`${d.label}: ${d.tooltip}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(active === i ? null : i)}
              />
            </g>
          );
        })}
      </svg>
      {active !== null && data[active] && (
        <div
          className="tooltip"
          role="status"
          style={{
            left: `clamp(60px, ${((PAD.left + slot * active + slot / 2) / W) * 100}%, calc(100% - 60px))`,
            top: `${(Math.min(...[PAD.top + innerH, ...[y(data[active].segments.reduce((s, x) => s + x.value, 0))]]) / H) * 100}%`,
          }}
        >
          <strong>{data[active].label}</strong> · {data[active].tooltip}
        </div>
      )}
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            {tableHead.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
