// Renders the PWA icons and favicon from the master artwork in public/icons/icon.svg.
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const out = new URL('../public/icons/', import.meta.url);
const master = readFileSync(new URL('icon.svg', out), 'utf8');
const BG = '#22332A';
const art = master.match(/<g id="art">[\s\S]*?<\/g>/)[0];

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${inner}</svg>`;
const png = (source, size) => new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();

// Full bleed: iOS and most launchers apply their own rounded mask.
const full = svg(`<rect width="1024" height="1024" fill="${BG}"/>${art}`);
// Maskable: keep the artwork inside the 80% safe zone so circle and squircle masks never cut it.
const maskable = svg(`<rect width="1024" height="1024" fill="${BG}"/><g transform="translate(102.4 102.4) scale(0.8)">${art}</g>`);
// Favicon: rounded tile, since browser tabs don't mask.
const favicon = svg(`<rect width="1024" height="1024" rx="228" fill="${BG}"/>${art}`);

writeFileSync(new URL('icon-192.png', out), png(full, 192));
writeFileSync(new URL('icon-512.png', out), png(full, 512));
writeFileSync(new URL('icon-maskable-512.png', out), png(maskable, 512));
writeFileSync(new URL('apple-touch-icon.png', out), png(full, 180));
writeFileSync(new URL('favicon.svg', out), favicon.replace(/\s*\n\s*/g, ''));
console.log('Icons written to public/icons');
