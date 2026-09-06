const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { createHmac } = require('node:crypto');
const root = path.resolve(__dirname, '..');

function loadFunction(name, extras = {}) {
  let source = fs.readFileSync(path.join(root, 'supabase/functions', name, 'index.ts'), 'utf8');
  source = source.replace(/^import .*?;\r?\n/gm, '');
  const environment = { SITE_URL: 'https://qunluo-kiwi.com', RESEND_API_KEY: 'test-only', SUBSCRIBE_SIGNING_KEY: 'test-only' };
  let handler;
  const context = {
    Request, Response, Headers, URL, URLSearchParams, Date,
    Deno: { env: { get: (name) => environment[name] }, serve: (fn) => { handler = fn; } },
    corsHeaders: () => ({}),
    okJson: (_, data, init) => Response.json(data, init),
    errJson: (_, status, message, code = 'error') => Response.json({ ok: false, error: { message, code } }, { status }),
    readJson: (req) => req.json(), normalizeDeviceId: (s) => s,
    normalizePostSlug: (s) => { if (!s.startsWith('blog/') || s === 'blog/index') throw Error('invalid'); return s; },
    isEmail: (s) => s.includes('@'), getClientIp: () => 'test-ip', sha256Hex: async () => 'test-hash',
    hmacSha256Base64Url: async () => 'test-signature', base64UrlEncodeText: (s) => Buffer.from(s).toString('base64url'),
    verifyTurnstile: async () => ({ success: true }), rateLimitOrThrow: async () => {},
    ...extras
  };
  vm.runInNewContext(stripTypeScriptTypes(source), context);
  return handler;
}

function database(initial = null) {
  let record = initial;
  const writes = [];
  const client = { from(table) {
    let operation = 'select'; let value;
    const query = {
      select() { return query; }, eq() { return query; }, neq() { return query; },
      update(v) { operation = 'update'; value = v; return query; },
      insert(v) { operation = 'insert'; value = v; return query; },
      upsert(v) { operation = 'upsert'; value = v; return query; },
      maybeSingle() { return Promise.resolve({ data: record, error: null }); },
      then(resolve, reject) {
        if (operation !== 'select') { writes.push({ table, operation, value }); record = { ...record, ...value }; }
        return Promise.resolve({ data: record, count: 7, error: null }).then(resolve, reject);
      }
    };
    return query;
  } };
  return { client, writes };
}
const post = (data) => new Request('https://example.test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

test('initial like state is read without a captcha and without database writes', async () => {
  const db = database({ id: 1, liked: true });
  const handler = loadFunction('like-toggle', { getServiceClient: () => db.client, verifyTurnstile: () => { throw Error('must not verify for reads'); } });
  const response = await handler(new Request('https://example.test?postSlug=blog/article&deviceId=device-test'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, count: 7, liked: true });
  assert.equal(db.writes.length, 0);
});
test('repeating a desired like state cannot invert the visitor’s choice', async () => {
  const db = database({ id: 1, liked: true });
  const handler = loadFunction('like-toggle', { getServiceClient: () => db.client });
  const response = await handler(post({ postSlug: 'blog/article', deviceId: 'device-test', liked: true, captchaToken: 'test' }));
  assert.equal((await response.json()).liked, true);
  assert.equal(db.writes[0].value.liked, true);
});
test('failed verification prevents a like mutation', async () => {
  const db = database();
  const handler = loadFunction('like-toggle', { getServiceClient: () => db.client, verifyTurnstile: async () => ({ success: false }) });
  const response = await handler(post({ postSlug: 'blog/article', deviceId: 'device-test', captchaToken: 'invalid' }));
  assert.equal(response.status, 400);
  assert.equal(db.writes.length, 0);
});
test('a repeated subscription keeps an active reader active and localizes the confirmation', async () => {
  const db = database({ status: 'active' });
  let mail;
  const handler = loadFunction('subscribe', { getServiceClient: () => db.client, fetch: async (_, options) => { mail = JSON.parse(options.body); return Response.json({ id: 'test' }); } });
  const response = await handler(post({ email: 'reader@example.test', captchaToken: 'test', locale: 'zh-CN' }));
  assert.equal(response.status, 200);
  assert.equal(db.writes.length, 0);
  assert.match(mail.subject, /确认订阅/);
  assert.match(mail.html, /\/zh\/subscribe.html#confirm=/);
});
test('failed mail delivery does not create or change a subscription', async () => {
  const db = database();
  const handler = loadFunction('subscribe', { getServiceClient: () => db.client, fetch: async () => new Response('provider failure', { status: 500 }) });
  const response = await handler(post({ email: 'reader@example.test', captchaToken: 'test' }));
  assert.equal(response.status, 502);
  assert.equal(db.writes.length, 0);
});
test('blog listing pages do not include article interaction widgets', () => {
  for (const prefix of ['', 'zh/']) {
    assert.equal(fs.readFileSync(path.join(root, prefix, 'blog/_metadata.yml'), 'utf8').trim(), '{}');
    assert.match(fs.readFileSync(path.join(root, prefix, 'blog/Automatic-Research-20260401.qmd'), 'utf8'), /turnstile-blog/);
  }
});

test('subscription confirmation accepts only a valid unexpired email signature', async () => {
  const db = database();
  const sign = (payload) => createHmac('sha256', 'test-only').update(payload).digest('base64url');
  const handler = loadFunction('subscribe-confirm', {
    getServiceClient: () => db.client,
    hmacSha256Base64Url: async (payload) => sign(payload),
    base64UrlDecodeText: (value) => Buffer.from(value, 'base64url').toString('utf8'),
  });
  const email = Buffer.from('reader@example.test').toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  for (const payload of [`${email}.${now - 90000}`, `${email}.${now + 1000}`]) {
    assert.equal((await handler(post({ token: `${payload}.${sign(payload)}` }))).status, 401);
  }
  assert.equal((await handler(post({ token: `${email}.${now}.forged` }))).status, 401);
  assert.equal(db.writes.length, 0);
  const payload = `${email}.${now}`;
  assert.equal((await handler(post({ token: `${payload}.${sign(payload)}` }))).status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(db.writes[0].value)), { email: 'reader@example.test', status: 'active' });
});

test('the browser supplies the public JWT when confirming an email and removes the used link', async () => {
  const requests = [];
  const nodes = {
    'ql-subscribe-form': { addEventListener() {} },
    'ql-subscribe-submit': {},
    'ql-subscribe-status': {},
  };
  let cleaned;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactions.js'), 'utf8'), {
    document: { documentElement: { lang: 'zh-CN' }, getElementById: (id) => nodes[id], addEventListener() {}, title: 'Subscribe' },
    window: { location: { href: 'https://qunluo-kiwi.com/zh/subscribe.html#confirm=signed-email-token' }, dispatchEvent() {} },
    history: { replaceState(_, __, url) { cleaned = url; } },
    SUPABASE_FUNCTIONS_URL: 'https://example.test/functions/v1',
    URL, URLSearchParams, AbortController, Event, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      requests.push({ url, options });
      return Response.json(url === '/assets/supabase-public.json' ? { anonKey: 'test-public-key' } : { ok: true });
    },
  });
  await new Promise(setImmediate);
  assert.equal(requests[1].url, 'https://example.test/functions/v1/subscribe-confirm');
  assert.equal(requests[1].options.headers.Authorization, 'Bearer test-public-key');
  assert.deepEqual(JSON.parse(requests[1].options.body), { token: 'signed-email-token' });
  assert.equal(cleaned, '/zh/subscribe.html');
  assert.equal(nodes['ql-subscribe-submit'].disabled, false);
  assert.match(nodes['ql-subscribe-status'].textContent, /订阅成功/);
});
