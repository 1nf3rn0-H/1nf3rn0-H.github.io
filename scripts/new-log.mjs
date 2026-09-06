import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ask = createInterface({ input, output });
const title = await ask.question('Title: ');
const description = await ask.question('Description: ');
const type = await ask.question('Type (article/research-note/experiment/architecture/field-note): ');
const category = await ask.question('Category: ');
const tags = await ask.question('Tags (comma-separated): ');
const difficulty = await ask.question('Difficulty (introductory/intermediate/advanced, optional): ');
const status = await ask.question('Status (draft/published): ');
const tools = await ask.question('Tools (comma-separated, optional): ');
const platforms = await ask.question('Platforms (comma-separated, optional): ');
const signals = await ask.question('Telemetry signals (comma-separated, optional): ');
const mitre = await ask.question('MITRE techniques (comma-separated, optional): ');
ask.close();
const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
if (!title || !description || !slug) throw new Error('A title and description are required.');
const file = `src/content/logs/${slug}.md`;
try { await access(file, constants.F_OK); throw new Error(`${file} already exists.`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const list = (value) => value ? `[${value.split(',').map((item) => item.trim()).filter(Boolean).join(', ')}]` : '[]';
const today = new Date().toISOString().slice(0, 10);
const content = `---\ntitle: "${title.replaceAll('"', '\\"')}"\ndescription: "${description.replaceAll('"', '\\"')}"\npublishedAt: ${today}\nupdatedAt: ${today}\nstatus: ${status || 'draft'}\ntype: ${type || 'research-note'}\ncategory: ${category || 'research'}\ntags: ${list(tags)}\ndifficulty: ${difficulty || 'intermediate'}\nfeatured: false\ntools: ${list(tools)}\nplatforms: ${list(platforms)}\nsignals: ${list(signals)}\nmitre: ${list(mitre)}\n---\n\n## Context\n\nDescribe the system, research question, or operational problem.\n\n## Hypothesis\n\nState the idea being explored.\n\n## Data and telemetry\n\nDescribe data sources, assumptions, schemas, and visibility constraints.\n\n## Design\n\nExplain the architecture or methodology.\n\n## Implementation\n\nDocument the implementation.\n\n## Observations\n\nRecord findings, failures, limitations, and unexpected behavior.\n\n## Conclusion\n\nSummarize the outcome and next research steps.\n`;
await mkdir('src/content/logs', { recursive: true }); await writeFile(file, content);
console.log(`\nCreated: ${file}\n\nNext:\n  npm run dev\n  npm run check`);
