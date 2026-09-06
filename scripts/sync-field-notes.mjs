import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.resolve(projectRoot, '..', 'web', '.daily', 'editions');
const destinationDirectory = path.join(projectRoot, 'src', 'data');
const destination = path.join(destinationDirectory, 'current-edition.json');
const archiveDirectory = path.join(destinationDirectory, 'field-notes');

const editions = (await readdir(sourceDirectory))
  .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort();

if (editions.length === 0) {
  throw new Error(`No generated editions found in ${sourceDirectory}`);
}

const latest = editions.at(-1);
await mkdir(destinationDirectory, { recursive: true });
await mkdir(archiveDirectory, { recursive: true });
const source = path.join(sourceDirectory, latest);
await copyFile(source, destination);
await copyFile(source, path.join(archiveDirectory, latest));
console.log(`Synced ${latest} as the current edition and preserved it in the archive`);
