import { open, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { MAX_BYTES, parseContract, parseEnv, analyze, type Environment } from './core.ts';
import { languages, t, type Language } from './i18n.ts';
import { makeReport } from './report.ts';
const args = process.argv.slice(2),
  candidate = args[args.indexOf('--lang') + 1];
let lang: Language = languages.includes(candidate as Language) ? (candidate as Language) : 'en';
async function input(path: string): Promise<string> {
  try {
    const file = await open(path, 'r');
    try {
      if (!(await file.stat()).isFile()) throw new Error();
      const buffer = Buffer.alloc(MAX_BYTES + 1);
      let offset = 0;
      while (offset < buffer.length) {
        const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, offset);
        if (!bytesRead) break;
        offset += bytesRead;
      }
      if (offset > MAX_BYTES) throw new Error();
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, offset));
    } finally {
      await file.close();
    }
  } catch {
    throw new Error('input');
  }
}
try {
  let contractPath = '',
    out = '',
    help = false;
  const specs: { name: string; file: string }[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (
      !['--contract', '--env', '--out', '--lang'].includes(arg) ||
      !args[i + 1] ||
      args[i + 1].startsWith('--')
    )
      throw new Error('options');
    const value = args[++i];
    if (arg === '--contract') contractPath = value;
    if (arg === '--out') out = value;
    if (arg === '--lang') {
      if (!languages.includes(value as Language)) throw new Error('languageError');
      lang = value as Language;
    }
    if (arg === '--env') {
      const index = value.indexOf('=');
      if (index < 1 || !value.slice(index + 1)) throw new Error('options');
      specs.push({ name: value.slice(0, index), file: value.slice(index + 1) });
    }
  }
  if (help)
    console.log(
      `Env Lens 0.1.0\n${t(lang, 'usage')}\n\n${t(lang, 'options')}\n\nnpm run check -- --contract examples/contract.json --env local=examples/local.env.sample --env preview=examples/preview.env.sample --out reports/review --lang ${lang}\n\nExit 0: no blocking checks. Exit 1: missing/empty required keys, duplicates, or syntax errors. Exit 2: input/setup/output error.\nWithout --out: prints the value-free JSON report to stdout.\nExisting output folders are never overwritten.`,
    );
  else {
    if (
      !contractPath ||
      !specs.length ||
      specs.length > 3 ||
      specs.some((spec) => !/^\w[\w-]{0,31}$/.test(spec.name)) ||
      new Set(specs.map((spec) => spec.name)).size !== specs.length
    )
      throw new Error('options');
    const contract = parseContract(await input(contractPath));
    const environments: Environment[] = [];
    for (const spec of specs)
      environments.push({ name: spec.name, parsed: parseEnv(await input(spec.file)) });
    const report = analyze(contract, environments, lang),
      json = JSON.stringify(report, null, 2) + '\n';
    if (out) {
      try {
        const path = resolve(out);
        await mkdir(dirname(path), { recursive: true });
        await mkdir(path);
        await writeFile(resolve(path, 'report.json'), json, { flag: 'wx' });
        await writeFile(resolve(path, 'index.html'), makeReport(report), { flag: 'wx' });
      } catch {
        throw new Error('output');
      }
      console.log(
        `${t(lang, 'saved')} · ${report.rows.length} ${t(lang, 'keys')} · ${report.blocking} ${t(lang, 'blocking')}`,
      );
    } else process.stdout.write(json);
    process.exitCode = report.blocking ? 1 : 0;
  }
} catch (error) {
  console.error(t(lang, error instanceof Error ? error.message : 'options'));
  process.exitCode = 2;
}
