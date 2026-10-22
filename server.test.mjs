import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createPresenceServer } from './server.mjs';

let currentTime = 0;
const server = createPresenceServer({ now: () => currentTime });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
after(() => server.close());
const url = () => `http://127.0.0.1:${server.address().port}`;

test('only active client XUIDs receive a badge', async () => {
  const heartbeat = await fetch(`${url()}/v1/heartbeat`, {
    method: 'POST', body: '12345678901',
  });
  assert.equal(heartbeat.status, 204);
  const check = await fetch(`${url()}/v1/check`, {
    method: 'POST', body: '12345678901\n98765432109',
  });
  assert.equal(check.status, 200);
  assert.equal(await check.text(), '12345678901');
});

test('rejects malformed XUIDs and oversized queries', async () => {
  const bad = await fetch(`${url()}/v1/heartbeat`, { method: 'POST', body: 'somebody' });
  assert.equal(bad.status, 400);
  const tooMany = await fetch(`${url()}/v1/check`, {
    method: 'POST', body: Array(257).fill('12345678901').map((v, i) => `${v}${i}`).join('\n'),
  });
  assert.equal(tooMany.status, 400);
});

test('removes clients when the heartbeat expires', async () => {
  currentTime = 90_000;
  const check = await fetch(`${url()}/v1/check`, {
    method: 'POST', body: '12345678901',
  });
  assert.equal(await check.text(), '');
});

test('responds to health checks', async () => {
  const health = await fetch(`${url()}/healthz`);
  assert.equal(health.status, 200);
});
