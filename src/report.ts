import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { messages } from './i18n.ts';
import type { Report } from './core.ts';
const safe = (value: unknown) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  );
const hash = (value: string) => createHash('sha256').update(value).digest('base64');
export function makeReport(report: Report): string {
  const css = readFileSync(new URL('./report.css', import.meta.url), 'utf8');
  const js =
    `const REPORT=${safe(report)};const MESSAGES=${safe(messages)};\n` +
    readFileSync(new URL('./report-client.js', import.meta.url), 'utf8');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'sha256-${hash(css)}'; script-src 'sha256-${hash(js)}'; base-uri 'none'; form-action 'none'; object-src 'none'"><title>Env Lens — configuration without values</title><style>${css}</style></head><body>
  <header><a class="brand" href="https://github.com/jeffrog-256k1/env-lens"><b>[∅]</b> env lens <small>/ 0.1</small></a><nav><a data-t="docs" href="https://github.com/jeffrog-256k1/env-lens"></a><label class="sr" for="language" data-t="language"></label><select id="language"><option value="en">English</option><option value="ko">한국어</option><option value="zh-CN">简体中文</option><option value="ja">日本語</option><option value="es">Español</option></select></nav></header>
  <main><section class="hero"><div><p class="eyebrow" data-t="eyebrow"></p><h1><span data-t="title"></span><br><em data-t="accent"></em></h1><p class="intro" data-t="intro"></p></div><div class="diagram" aria-hidden="true"><span>LOCAL</span><span>PREVIEW</span><span>PRODUCTION</span><i></i><b>[ NAME / STATE ]</b><p>VALUES → ∅</p></div></section>
  <p id="sample" class="sample" data-t="sample" hidden></p><section class="stats"><div><b id="key-count"></b><span data-t="keys"></span></div><div><b id="env-count"></b><span data-t="envs"></span></div><div><b id="blocking-count"></b><span data-t="blocking"></span></div></section>
  <section class="panel"><div class="section-head"><h2 data-t="matrix"></h2><button id="download" data-t="download"></button></div><div class="filters"><label class="sr" for="search" data-t="search"></label><input id="search" type="search" autocomplete="off"><button id="filter" aria-pressed="false" data-t="onlyIssues"></button></div><div class="table-scroll"><table><thead id="head"></thead><tbody id="rows"></tbody></table></div><p id="empty" data-t="none" hidden></p></section>
  <section class="parser"><h2 data-t="issues"></h2><ul id="issues"></ul></section><section class="notes"><article><h3 data-t="noteTitle"></h3><p data-t="note"></p></article><article><h3 data-t="privacyTitle"></h3><p data-t="privacy"></p></article></section></main>
  <footer><a href="https://leejungjae.app">BY JEFFROG-256K1 ↗</a><span>KEYS IN. VALUES OUT OF SIGHT.</span><a href="https://github.com/jeffrog-256k1/env-lens">MIT · GITHUB ↗</a></footer><script>${js}</script></body></html>`;
}
