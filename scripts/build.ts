import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { analyze, parseContract, parseEnv } from '../src/core.ts';
import { makeReport } from '../src/report.ts';
const contract = parseContract(await readFile('examples/contract.json', 'utf8'));
const environments = await Promise.all(
  ['local', 'preview', 'production'].map(async (name) => ({
    name,
    parsed: parseEnv(await readFile(`examples/${name}.env.sample`, 'utf8')),
  })),
);
const report = { ...analyze(contract, environments), sample: true };
await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', makeReport(report));
console.log('Built offline sample report.');
