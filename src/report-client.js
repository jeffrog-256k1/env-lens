const languages = ['en', 'ko', 'zh-CN', 'ja', 'es'];
let language = languages.includes(REPORT.language) ? REPORT.language : 'en',
  onlyIssues = false;
const $ = (id) => document.getElementById(id);
const t = (key) => MESSAGES[key]?.[languages.indexOf(language)] ?? key;
const node = (tag, text, cls) => {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
};
const glyph = { set: '●', empty: '○', missing: '−', duplicate: '≋', invalid: '!' };
function render() {
  document.documentElement.lang = language;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('language').value = language;
  $('search').placeholder = t('search');
  $('key-count').textContent = String(REPORT.rows.length).padStart(2, '0');
  $('env-count').textContent = String(REPORT.environments.length).padStart(2, '0');
  $('blocking-count').textContent = String(REPORT.blocking).padStart(2, '0');
  $('sample').hidden = !REPORT.sample;
  $('filter').setAttribute('aria-pressed', String(onlyIssues));
  const head = node('tr', '');
  head.append(node('th', t('key')), node('th', t('requirement')));
  for (const name of REPORT.environments) head.append(node('th', name));
  for (const th of head.children) th.scope = 'col';
  $('head').replaceChildren(head);
  const rows = REPORT.rows.filter(
    (row) =>
      row.key.toLowerCase().includes($('search').value.toLowerCase()) &&
      (!onlyIssues || row.cells.some((cell) => cell.blocking) || row.requirement === 'extra'),
  );
  $('rows').replaceChildren();
  for (const row of rows) {
    const tr = node('tr', '');
    const key = node('th', row.key);
    key.scope = 'row';
    tr.append(key, node('td', t(row.requirement), 'requirement'));
    for (const cell of row.cells) {
      const td = node('td', '');
      td.append(node('span', `${glyph[cell.state]} ${t(cell.state)}`, `state ${cell.state}`));
      if (cell.lines.length) {
        const lines = node('small', `${t('line')} ${cell.lines.join(', ')}`);
        td.append(lines);
      }
      tr.append(td);
    }
    $('rows').append(tr);
  }
  $('empty').hidden = rows.length > 0;
  $('issues').replaceChildren();
  if (!REPORT.issues.length) $('issues').append(node('li', t('noIssues')));
  for (const issue of REPORT.issues)
    $('issues').append(
      node(
        'li',
        `${issue.environment} / ${t('line')} ${issue.line}${issue.key ? ` / ${issue.key}` : ''} — ${t(issue.code)}`,
      ),
    );
}
$('language').addEventListener('change', (event) => {
  language = event.target.value;
  render();
});
$('search').addEventListener('input', render);
$('filter').addEventListener('click', () => {
  onlyIssues = !onlyIssues;
  render();
});
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ ...REPORT, language }, null, 2) + '\n'], {
      type: 'application/json',
    }),
  );
  const a = node('a', '');
  a.href = url;
  a.download = 'env-lens-report.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
