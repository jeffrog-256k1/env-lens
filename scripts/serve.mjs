import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
createServer(async (req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404).end();
    return;
  }
  try {
    const html = await readFile('dist/index.html');
    res
      .writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .end(html);
  } catch {
    res.writeHead(503).end('Run npm run build first.');
  }
}).listen(4319, '127.0.0.1', () => console.log('Env Lens: http://127.0.0.1:4319'));
