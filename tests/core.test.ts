import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv, parseContract, analyze, MAX_BYTES } from '../src/core.ts';
import { makeReport } from '../src/report.ts';
const contract = parseContract('{"version":1,"required":["A","B"],"optional":["C"]}');
test('quoted hashes, comments, export, whitespace, duplicates, no expansion', () => {
  const parsed = parseEnv(
    '\uFEFF# comment\r\nexport A="hello#world" # ok\r\nB= # empty\nC=\'  \'\nD=${SHELL}\nE=$(echo no)\nA=again\n',
  );
  assert.deepEqual(
    parsed.entries.map((e) => [e.key, e.state]),
    [
      ['A', 'duplicate'],
      ['B', 'empty'],
      ['C', 'empty'],
      ['D', 'set'],
      ['E', 'set'],
    ],
  );
  assert.deepEqual(parsed.entries[0].lines, [2, 7]);
  assert.equal(parseEnv('A="\\n\\t"').entries[0].state, 'empty');
  assert.equal(parseEnv('A="escaped\\"quote"').entries[0].state, 'set');
});
test('syntax failures and unterminated multiline do not expose source', () => {
  const parsed = parseEnv(
    'A="CANARY-ONE" trailing-CANARY-TWO\nnot-a-key CANARY-THREE\nB="CANARY-FOUR\nPRIVATE_CONTINUATION=CANARY-FIVE\n"',
  );
  assert.equal(parsed.entries[0].state, 'invalid');
  assert.equal(parsed.entries.length, 2);
  assert.equal(parsed.issues.at(-1)?.code, 'multiline');
  assert.doesNotMatch(JSON.stringify(parsed), /CANARY|PRIVATE_CONTINUATION/);
});
test('contract and input limits fail with generic diagnostics', () => {
  for (const value of [
    'CANARY',
    '{"CANARY":true}',
    '{"version":1,"required":["A","A"],"optional":[]}',
    '{"version":1,"required":["CANARY-SECRET"],"optional":[]}',
  ])
    assert.throws(() => parseContract(value), /^Error: contract$/);
  assert.throws(() => parseEnv('A=' + 'x'.repeat(MAX_BYTES)), /^Error: input$/);
  assert.throws(() => parseEnv('A=\0CANARY'), /^Error: input$/);
  assert.throws(
    () => parseEnv(Array.from({ length: 201 }, (_, i) => `K${i}=x`).join('\n')),
    /^Error: input$/,
  );
});
test('presence matrix distinguishes blockers, missing optional, and extra keys', () => {
  const report = analyze(contract, [
    { name: 'local', parsed: parseEnv('A=x\nB=\nEXTRA=x') },
    { name: 'prod', parsed: parseEnv('B=x\nC=x\nC=y') },
  ]);
  assert.equal(report.blocking, 3);
  assert.equal(report.warnings, 1);
  assert.equal(report.rows.find((row) => row.key === 'A')?.cells[1].state, 'missing');
  assert.equal(report.rows.find((row) => row.key === 'C')?.cells[0].blocking, false);
  assert.throws(
    () => analyze(contract, [{ name: 'bad<script>', parsed: parseEnv('') }]),
    /^Error: options$/,
  );
});
test('values never enter JSON or HTML, including malformed inputs and template expressions', () => {
  const secrets = [
    'CANARY_01',
    '</script><script>alert("CANARY_02")</script>',
    '${CANARY_03}',
    '$(CANARY_04)',
    'CANARY_05',
  ];
  for (const value of secrets) {
    const report = analyze(contract, [
      { name: 'local', parsed: parseEnv(`A=${value}\nB='${value}'\nBROKEN ${value}`) },
    ]);
    const output = JSON.stringify(report) + makeReport(report);
    for (const marker of ['CANARY_01', 'CANARY_02', 'CANARY_03', 'CANARY_04', 'CANARY_05'])
      assert.ok(!output.includes(marker));
    assert.ok(!output.includes('BROKEN '));
  }
});
test('CLI read-only behavior, all exit codes, safe errors, new-folder output', () => {
  mkdirSync('test-results', { recursive: true });
  const dir = mkdtempSync(resolve('test-results', 'cli-'));
  const config = resolve(dir, 'contract.json'),
    env = resolve(dir, 'input.env'),
    out = resolve(dir, 'report');
  writeFileSync(config, JSON.stringify(contract));
  writeFileSync(env, 'A=CANARY_CLI_SECRET\nB=ok');
  const before = readFileSync(env);
  const run = (args: string[]) =>
    spawnSync(
      process.execPath,
      [
        '--disable-warning=ExperimentalWarning',
        '--experimental-strip-types',
        'src/cli.ts',
        ...args,
      ],
      { encoding: 'utf8' },
    );
  const args = ['--contract', config, '--env', `local=${env}`];
  const good = run(args);
  assert.equal(good.status, 0, good.stderr);
  assert.equal(JSON.parse(good.stdout).blocking, 0);
  assert.doesNotMatch(good.stdout + good.stderr, /CANARY/);
  assert.deepEqual(readFileSync(env), before);
  const saved = run([...args, '--out', out]);
  assert.equal(saved.status, 0, saved.stderr);
  assert.doesNotMatch(readFileSync(resolve(out, 'index.html'), 'utf8'), /CANARY/);
  assert.equal(run([...args, '--out', out]).status, 2);
  writeFileSync(env, 'A=');
  assert.equal(run(args).status, 1);
  const bad = run(['--contract', 'CANARY_BAD_PATH', '--env', 'local=missing']);
  assert.equal(bad.status, 2);
  assert.doesNotMatch(bad.stdout + bad.stderr, /CANARY/);
  writeFileSync(config, '{CANARY_BAD_JSON');
  const invalid = run(args);
  assert.equal(invalid.status, 2);
  assert.doesNotMatch(invalid.stdout + invalid.stderr, /CANARY/);
});
