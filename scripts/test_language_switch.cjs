const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, '_includes/language-switch.js'), 'utf8');

function page(url, language, anchors) {
  const filename = new URL(url).pathname.replace(/^\/zh\//, '/');
  const links = ['en', 'zh-CN'].map((locale) => ({
    href: locale === 'en' ? filename : '/zh' + filename,
    getAttribute(name) { return name === 'href' ? this.href : locale; }
  }));
  const listeners = {};
  const window = { location: new URL(url), addEventListener(event, handler) { listeners[event] = handler; } };
  const document = {
    documentElement: { lang: language },
    getElementById() { return { textContent: JSON.stringify(anchors) }; },
    querySelectorAll() { return links; }
  };
  vm.runInNewContext(script, { URL, window, document });
  return { links, window, listeners };
}

test('switches to the same article and preserves query plus translated section', () => {
  const state = page('https://qunluo-kiwi.com/content/about.html?from=city#education', 'en', { education: '教育经历' });
  assert.equal(state.links[0].href, '/content/about.html?from=city#education');
  assert.equal(decodeURI(state.links[1].href), '/zh/content/about.html?from=city#教育经历');
});

test('updates the reverse link after navigating to another section', () => {
  const state = page('https://qunluo-kiwi.com/zh/content/about.html#教育经历', 'zh-CN', { '教育经历': 'education', '研究兴趣': 'research-interests' });
  state.window.location.hash = '#研究兴趣';
  state.listeners.hashchange();
  assert.equal(state.links[0].href, '/content/about.html#research-interests');
  assert.equal(decodeURI(state.links[1].href), '/zh/content/about.html#研究兴趣');
});

test('keeps subscription confirmation parameters while switching languages', () => {
  const state = page('https://qunluo-kiwi.com/subscribe.html?source=mail#confirm=test-token', 'en', {});
  assert.equal(state.links[1].href, '/zh/subscribe.html?source=mail#confirm=test-token');
});

test('drops unmapped or malformed fragments instead of producing broken section links', () => {
  const state = page('https://qunluo-kiwi.com/content/about.html#unknown', 'en', {});
  assert.equal(state.links[1].href, '/zh/content/about.html');
  state.window.location.hash = '#%E0%A4%A';
  assert.doesNotThrow(() => state.listeners.hashchange());
  assert.equal(state.links[1].href, '/zh/content/about.html');
});

test('English and Chinese editions keep the existing blog interaction identity', () => {
  for (const include of ['turnstile-head.html', 'turnstile-head-zh.html']) {
    const html = fs.readFileSync(path.join(root, '_includes', include), 'utf8');
    const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
    for (const prefix of ['/', '/zh/', '/QunLuo.github.io/', '/QunLuo.github.io/zh/']) {
      const context = { window: { location: { pathname: prefix + 'blog/Automatic-Research-20260401.html' } } };
      vm.createContext(context);
      vm.runInContext(code, context);
      assert.equal(vm.runInContext('getPostSlug()', context), 'blog/Automatic-Research-20260401');
    }
  }
});
