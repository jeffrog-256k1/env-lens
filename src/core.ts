export const MAX_BYTES = 65536,
  MAX_KEYS = 200;
const keyPattern = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
export interface Contract {
  version: 1;
  required: string[];
  optional: string[];
}
export type State = 'set' | 'empty' | 'missing' | 'duplicate' | 'invalid';
export interface Entry {
  key: string;
  state: State;
  lines: number[];
}
export interface Issue {
  line: number;
  code: 'syntax' | 'multiline' | 'duplicate';
  key?: string;
}
export interface Parsed {
  entries: Entry[];
  issues: Issue[];
}
export interface Environment {
  name: string;
  parsed: Parsed;
}
export interface Cell {
  state: State;
  lines: number[];
  blocking: boolean;
}
export interface Report {
  version: 1;
  createdAt: string;
  language: string;
  sample?: boolean;
  environments: string[];
  rows: { key: string; requirement: 'required' | 'optional' | 'extra'; cells: Cell[] }[];
  issues: { environment: string; line: number; code: string; key?: string }[];
  blocking: number;
  warnings: number;
}

export function parseContract(source: string): Contract {
  if (Buffer.byteLength(source) > MAX_BYTES) throw new Error('contract');
  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch {
    throw new Error('contract');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('contract');
  const value = raw as Record<string, unknown>;
  if (
    Object.keys(value).some((key) => !['version', 'required', 'optional'].includes(key)) ||
    value.version !== 1 ||
    !Array.isArray(value.required) ||
    !Array.isArray(value.optional)
  )
    throw new Error('contract');
  const keys = [...value.required, ...value.optional];
  if (
    !keys.length ||
    keys.length > MAX_KEYS ||
    keys.some((key) => typeof key !== 'string' || !keyPattern.test(key)) ||
    new Set(keys).size !== keys.length
  )
    throw new Error('contract');
  return { version: 1, required: value.required as string[], optional: value.optional as string[] };
}

// Returns only state; raw values never leave this parser or enter diagnostics.
function valueState(input: string): { state: 'set' | 'empty' | 'invalid'; unterminated?: boolean } {
  const value = input.trim();
  const quote = value[0];
  if (quote !== "'" && quote !== '"')
    return { state: value.split('#', 1)[0].trim() ? 'set' : 'empty' };
  let nonWhitespace = false;
  for (let i = 1; i < value.length; i++) {
    const ch = value[i];
    if (ch === quote) {
      const tail = value.slice(i + 1).trim();
      return { state: tail && !tail.startsWith('#') ? 'invalid' : nonWhitespace ? 'set' : 'empty' };
    }
    if (ch === '\\' && quote === '"' && i + 1 < value.length) {
      const escaped = value[++i];
      if (!['n', 'r', 't', ' '].includes(escaped)) nonWhitespace = true;
    } else if (!/\s/u.test(ch)) nonWhitespace = true;
  }
  return { state: 'invalid', unterminated: true };
}

export function parseEnv(source: string): Parsed {
  if (Buffer.byteLength(source) > MAX_BYTES || source.includes('\0')) throw new Error('input');
  const entries = new Map<string, Entry>(),
    issues: Issue[] = [];
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index].trim(),
      line = index + 1;
    if (!text || text.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]{0,127})\s*=\s*(.*)$/.exec(text);
    if (!match) {
      issues.push({ line, code: 'syntax' });
      continue;
    }
    const [, key, raw] = match;
    const parsed = valueState(raw),
      prior = entries.get(key);
    const state = parsed.state === 'invalid' ? 'invalid' : prior ? 'duplicate' : parsed.state;
    entries.set(key, {
      key,
      state: prior?.state === 'invalid' ? 'invalid' : state,
      lines: [...(prior?.lines ?? []), line],
    });
    if (prior) issues.push({ line, code: 'duplicate', key });
    if (parsed.state === 'invalid')
      issues.push({ line, code: parsed.unterminated ? 'multiline' : 'syntax', key });
    if (entries.size > MAX_KEYS) throw new Error('input');
    // Multiline values are deliberately unsupported. Stop instead of interpreting
    // a continuation of a secret as new variable names.
    if (parsed.unterminated) break;
  }
  return { entries: [...entries.values()], issues };
}

export function analyze(contract: Contract, environments: Environment[], language = 'en'): Report {
  if (
    environments.length < 1 ||
    environments.length > 3 ||
    environments.some((env) => !/^\w[\w-]{0,31}$/.test(env.name)) ||
    new Set(environments.map((env) => env.name)).size !== environments.length
  )
    throw new Error('options');
  const required = new Set(contract.required),
    optional = new Set(contract.optional);
  const keys = new Set([
    ...required,
    ...optional,
    ...environments.flatMap((env) => env.parsed.entries.map((entry) => entry.key)),
  ]);
  if (keys.size > MAX_KEYS) throw new Error('input');
  const rows = [...keys].sort().map((key) => {
    const requirement = required.has(key) ? 'required' : optional.has(key) ? 'optional' : 'extra';
    const cells = environments.map(({ parsed }) => {
      const entry = parsed.entries.find((item) => item.key === key);
      const state = entry?.state ?? 'missing';
      return {
        state,
        lines: entry?.lines ?? [],
        blocking:
          state === 'invalid' ||
          state === 'duplicate' ||
          (requirement === 'required' && state !== 'set'),
      };
    });
    return { key, requirement, cells };
  });
  const issues = environments.flatMap(({ name, parsed }) =>
    parsed.issues.map((issue) => ({ ...issue, environment: name })),
  );
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    language,
    environments: environments.map((env) => env.name),
    rows: rows as Report['rows'],
    issues,
    blocking:
      rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.blocking).length, 0) +
      issues.filter((issue) => !issue.key).length,
    warnings: rows.filter((row) => row.requirement === 'extra').length,
  };
}
