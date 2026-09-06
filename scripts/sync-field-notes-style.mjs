import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(projectRoot, '..', 'web', 'app', 'globals.css');
const destination = path.join(projectRoot, 'src', 'styles', 'field-notes-reference.css');
const css = await readFile(source, 'utf8');
const start = css.indexOf('body {');

if (start === -1) throw new Error('Could not find the Field Notes body styles');

const header = `@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');\n:root{--font-editorial:'Libre Baskerville';--font-utility:'Source Sans 3'}\n*{box-sizing:border-box}\nhtml{scroll-behavior:smooth}\na{color:inherit}\n`;
await writeFile(destination, `${header}${css.slice(start)}`);
console.log('Synced the local Field Notes stylesheet');
