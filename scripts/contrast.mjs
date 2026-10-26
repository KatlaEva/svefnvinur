// Checks WCAG contrast for every text/background token pair in both themes.
// Tokens are read straight from src/styles.css so this can never drift from the app.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No block for ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  const tokens = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[m[1]] = m[2];
  return tokens;
}

const day = block(':root');
const night = { ...day, ...block("[data-theme='night']") };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [foreground, background, minimum]: 4.5 for text, 3 for non-text UI / chart marks.
const pairs = [
  ['text', 'bg', 4.5],
  ['text', 'card', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'card', 4.5],
  ['muted', 'tint', 4.5],
  ['text', 'tint', 4.5],
  ['accent-ink', 'bg', 4.5],
  ['accent-ink', 'card', 4.5],
  ['accent-ink', 'tint', 4.5],
  ['on-accent', 'accent-ink', 4.5],
  ['help-ink', 'help-bg', 4.5],
  ['danger', 'card', 4.5],
  ['danger', 'bg', 4.5],
  ['bg', 'text', 4.5], // tooltips / toasts are inverted
  ['accent', 'card', 3],
  ['chart-night', 'card', 3],
  ['chart-nap', 'card', 3],
];

let failed = 0;
for (const [name, tokens] of [['day', day], ['night', night]]) {
  console.log(`\n${name} theme`);
  for (const [fg, bg, min] of pairs) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`  MISSING  --${fg} / --${bg}`);
      failed++;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  --${fg} ${tokens[fg]} on --${bg} ${tokens[bg]}`);
  }
}

if (failed) {
  console.error(`\n${failed} pair(s) below WCAG AA`);
  process.exit(1);
}
console.log('\nAll pairs meet WCAG AA.');
