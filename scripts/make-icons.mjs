// Generates the PWA icons (sage background, warm crescent moon) without any image dependencies.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x4e, 0x6e, 0x52];
const MOON = [0xfa, 0xf6, 0xef];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, scale) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const cx = size / 2, cy = size / 2, r = size * 0.3 * scale;
  const ox = cx + r * 0.42, oy = cy - r * 0.32, or = r * 0.86;
  const SS = 4;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
        const inA = (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
        const inB = (px - ox) ** 2 + (py - oy) ** 2 <= or * or;
        if (inA && !inB) hits++;
      }
      const a = hits / (SS * SS);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(BG[i] * (1 - a) + MOON[i] * a);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = new URL('../public/icons/', import.meta.url);
writeFileSync(new URL('icon-192.png', out), png(192, 1));
writeFileSync(new URL('icon-512.png', out), png(512, 1));
writeFileSync(new URL('icon-maskable-512.png', out), png(512, 0.8));
writeFileSync(new URL('apple-touch-icon.png', out), png(180, 0.9));
writeFileSync(
  new URL('favicon.svg', out),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4E6E52"/><mask id="m"><rect width="64" height="64" fill="#fff"/><circle cx="40" cy="25.9" r="16.5" fill="#000"/></mask><circle cx="32" cy="32" r="19.2" fill="#FAF6EF" mask="url(#m)"/></svg>`,
);
console.log('Icons written to public/icons');
