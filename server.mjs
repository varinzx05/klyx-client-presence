import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const validXuid = value => typeof value === 'string' && /^[1-9][0-9]{9,19}$/.test(value);

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 8192) {
        request.destroy();
        reject(new Error('body too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

export function createPresenceServer({ now = Date.now, ttlMs = 90_000 } = {}) {
  const online = new Map();
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method === 'GET' && request.url === '/healthz') {
      response.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
      return;
    }
    if (request.method !== 'POST' ||
        (request.url !== '/v1/heartbeat' && request.url !== '/v1/check')) {
      response.writeHead(404).end();
      return;
    }
    let body;
    try { body = await readBody(request); }
    catch { if (!response.destroyed) response.writeHead(413).end(); return; }
    const currentTime = now();
    for (const [xuid, lastSeen] of online) {
      if (currentTime - lastSeen >= ttlMs) online.delete(xuid);
    }
    if (request.url === '/v1/heartbeat') {
      const xuid = body.trim();
      if (!validXuid(xuid)) { response.writeHead(400).end(); return; }
      if (!online.has(xuid) && online.size >= 10_000) {
        response.writeHead(503).end();
        return;
      }
      online.set(xuid, currentTime);
      response.writeHead(204).end();
      return;
    }
    const requested = [...new Set(body.split(/\r?\n/).filter(Boolean))];
    if (requested.length > 256 || requested.some(xuid => !validXuid(xuid))) {
      response.writeHead(400).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(requested.filter(xuid => online.has(xuid)).join('\n'));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createPresenceServer().listen(port, host, () => console.log(`KLYX presence listening on ${host}:${port}`));
}
