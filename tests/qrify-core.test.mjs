import assert from 'node:assert/strict';
import { test } from 'node:test';

let core = {};
try {
  core = await import('../assets/js/qrify-core.mjs');
} catch {
  // The tests assert the missing public API as an assertion failure before implementation.
}

function api(name) {
  assert.equal(typeof core[name], 'function', `${name} must be exported`);
  return core[name];
}

test('URL mode adds HTTPS and preserves path and query', () => {
  assert.equal(api('buildPayload')('url', { url: 'example.com/path?q=1' }), 'https://example.com/path?q=1');
});

test('URL mode rejects non-HTTP schemes', () => {
  assert.throws(() => api('buildPayload')('url', { url: 'javascript:alert(1)' }), /HTTP|HTTPS|URL/i);
});

test('plain text preserves non-empty user content exactly', () => {
  assert.equal(api('buildPayload')('text', { text: '  Hello QRify\n' }), '  Hello QRify\n');
});

test('email mode accepts an address and emits a mailto URI', () => {
  assert.equal(api('buildPayload')('email', { email: 'melvin@example.com' }), 'mailto:melvin@example.com');
});

test('email mode accepts a valid mailto URI without duplicating its scheme', () => {
  assert.equal(api('buildPayload')('email', { email: 'mailto:melvin@example.com' }), 'mailto:melvin@example.com');
});

test('phone mode emits a normalized tel URI', () => {
  assert.equal(api('buildPayload')('phone', { phone: '+1 (555) 010-0200' }), 'tel:+15550100200');
});

test('Wi-Fi mode escapes reserved characters in the SSID and password', () => {
  assert.equal(
    api('buildPayload')('wifi', { ssid: 'Cafe;Main', password: 'p:ss,word\\tail', security: 'WPA' }),
    'WIFI:T:WPA;S:Cafe\\;Main;P:p\\:ss\\,word\\\\tail;;',
  );
});

test('open Wi-Fi mode does not require or emit a password', () => {
  assert.equal(api('buildPayload')('wifi', { ssid: 'Cafe', password: '', security: 'nopass' }), 'WIFI:T:nopass;S:Cafe;;');
});

test('vCard mode escapes field separators and newlines and uses CRLF records', () => {
  const expected = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Lovelace;Ada;;;',
    'FN:Ada Lovelace',
    'ORG:Engine\\, Inc\\;\\nWorks',
    'TEL;TYPE=CELL:+1 (555) 010-0200',
    'EMAIL:ada@example.test',
    'END:VCARD',
  ].join('\r\n');
  assert.equal(api('buildPayload')('contact', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    organization: 'Engine, Inc;\nWorks',
    phone: '+1 (555) 010-0200',
    email: 'ada@example.test',
  }), expected);
});

test('empty text and malformed email inputs are rejected', () => {
  assert.throws(() => api('buildPayload')('text', { text: ' \n\t' }), /required|empty|text/i);
  assert.throws(() => api('buildPayload')('email', { email: 'not-an-email' }), /email/i);
});

test('black and white have a 21:1 contrast ratio', () => {
  assert.equal(api('contrastRatio')('#000000', '#ffffff'), 21);
});

test('SVG output uses selected colors, requested dimensions, and a quiet zone', () => {
  const svg = api('svgFromMatrix')([[true, false], [false, true]], {
    size: 128,
    foreground: '#123456',
    background: '#fedcba',
    quietZone: 2,
  });
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /width="128"/);
  assert.match(svg, /height="128"/);
  assert.match(svg, /viewBox="0 0 6 6"/);
  assert.match(svg, /<rect[^>]+fill="#fedcba"/);
  assert.match(svg, /<path[^>]+fill="#123456"[^>]+d="M2 2h1v1h-1zM3 3h1v1h-1z"/);
});

test('SVG renderer rejects malformed matrices and non-hex colors', () => {
  const render = api('svgFromMatrix');
  assert.throws(() => render([], { size: 128, foreground: '#000000', background: '#ffffff' }), /matrix/i);
  assert.throws(() => render([[true]], { size: 128, foreground: 'red', background: '#ffffff' }), /color/i);
});
