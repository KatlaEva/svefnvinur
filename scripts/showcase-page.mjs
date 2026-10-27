// Turns dist-showcase/index.html into page.html for hosting as a Claude artifact:
// the host supplies the <html>/<head>/<body> skeleton, so keep only what goes inside.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../dist-showcase/', import.meta.url);
const html = readFileSync(new URL('index.html', dir), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = head
  .split('\n')
  .filter((l) => !/charset|name="viewport"|rel="(icon|apple-touch-icon|manifest)"|apple-mobile|mobile-web-app/.test(l))
  .join('\n');
writeFileSync(new URL('page.html', dir), `${keep.trim()}\n${body.trim()}\n`);
console.log('dist-showcase/page.html written');
