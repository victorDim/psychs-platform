import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const forbiddenMarkers = [
  'AUTOTUNED_RESILIENT',
  'Using initial fallback state',
  'Switch Benchmark Simulation',
];

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(path);
    return entry.name.endsWith('.js') ? [path] : [];
  }));
  return nested.flat();
}

const files = await javascriptFiles(fileURLToPath(new URL('../dist', import.meta.url)));
for (const file of files) {
  const bundle = await readFile(file, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (bundle.includes(marker)) {
      throw new Error(`Production bundle contains legacy synthetic marker ${JSON.stringify(marker)} in ${file}`);
    }
  }
}

console.log(`Verified ${files.length} production JavaScript bundle(s): no legacy synthetic fixtures.`);
