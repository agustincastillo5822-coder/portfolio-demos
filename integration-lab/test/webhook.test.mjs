import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { signWebhook, createWebhookVerifier } from '../src/webhook.mjs';

const secret = Buffer.alloc(32, 7);
const body = Buffer.from('{"id":"DEMO-001"}');
function request(timestamp = '1000', rawBody = body) {
  return { timestamp, rawBody, signature: signWebhook({ secret, timestamp, rawBody }), nowSeconds: 1000 };
}
test('Firmo el timestamp y los bytes exactos con HMAC SHA-256', () => {
  const expected = 'sha256=' + createHmac('sha256', secret).update(Buffer.concat([Buffer.from('1000.'), body])).digest('hex');
  assert.equal(request().signature, expected);
  assert.deepEqual(createWebhookVerifier({ secret })(request()), { ok: true });
});
test('Rechazo una repetición válida dentro del mismo verificador', () => {
  const verify = createWebhookVerifier({ secret });
  assert.equal(verify(request()).ok, true);
  assert.equal(verify(request()).reason, 'replay');
});
test('Rechazo alteraciones de cuerpo, timestamp o clave', () => {
  assert.equal(createWebhookVerifier({ secret })({ ...request(), rawBody: Buffer.from('{ "id":"DEMO-001"}') }).reason, 'invalid_signature');
  assert.equal(createWebhookVerifier({ secret })({ ...request(), timestamp: '1001' }).reason, 'invalid_signature');
  assert.equal(createWebhookVerifier({ secret: Buffer.alloc(32, 8) })(request()).reason, 'invalid_signature');
});
for (const [timestamp, expected] of [['700', true], ['699', 'expired'], ['1030', true], ['1031', 'future_timestamp']]) {
  test(`Aplico el límite temporal inclusivo en ${timestamp}`, () => {
    const result = createWebhookVerifier({ secret })(request(timestamp));
    assert.equal(expected === true ? result.ok : result.reason, expected);
  });
}
for (const timestamp of ['01000', '-1', '1e3', '1000.0', '', '1000\n', '9007199254740992', 1000]) {
  test(`Rechazo timestamp no canónico ${JSON.stringify(timestamp)}`, () => {
    assert.equal(createWebhookVerifier({ secret })({ ...request(), timestamp }).reason, 'invalid_timestamp');
    assert.throws(() => signWebhook({ secret, timestamp, rawBody: body }), TypeError);
  });
}
test('Rechazo firma ausente, prefijo incorrecto, hexadecimal inválido o longitud incorrecta', () => {
  for (const signature of [undefined, 'bad', 'sha256=ab', 'sha256=' + 'g'.repeat(64), 'sha256=' + '0'.repeat(64), 'SHA256=' + 'a'.repeat(64)]) {
    assert.equal(createWebhookVerifier({ secret })({ ...request(), signature }).reason, 'invalid_signature');
  }
});
test('Acoto el cuerpo y exijo bytes originales', () => {
  for (const rawBody of ['text', null, Buffer.alloc(65_537)]) {
    assert.equal(createWebhookVerifier({ secret })({ ...request(), rawBody }).reason, 'invalid_body');
    assert.throws(() => signWebhook({ secret, timestamp: '1000', rawBody }), TypeError);
  }
  assert.equal(createWebhookVerifier({ secret })(request('1000', Buffer.alloc(65_536))).ok, true);
});
test('Valido mi configuración y copio la clave para evitar mutaciones posteriores', () => {
  for (const value of ['secret', Buffer.alloc(31)]) assert.throws(() => createWebhookVerifier({ secret: value }), TypeError);
  for (const options of [{ maxAgeSeconds: -1 }, { maxAgeSeconds: 86_401 }, { maxFutureSkewSeconds: 301 }, { maxEntries: 0 }, { maxEntries: 100_001 }, { maxEntries: 1.5 }]) assert.throws(() => createWebhookVerifier({ secret, ...options }), RangeError);
  const mutable = Buffer.from(secret), verify = createWebhookVerifier({ secret: mutable });
  mutable.fill(0);
  assert.equal(verify(request()).ok, true);
});
test('Rechazo relojes inválidos o que retroceden', () => {
  for (const nowSeconds of [-1, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.equal(createWebhookVerifier({ secret })({ ...request(), nowSeconds }).reason, 'invalid_clock');
  const verify = createWebhookVerifier({ secret });
  verify(request());
  assert.equal(verify({ ...request(), nowSeconds: 999 }).reason, 'invalid_clock');
});
test('Fallo cerrado cuando lleno el almacén y recupero capacidad tras la expiración', () => {
  const verify = createWebhookVerifier({ secret, maxEntries: 1 });
  assert.equal(verify(request()).ok, true);
  assert.equal(verify(request('1001')).reason, 'replay_store_full');
  assert.equal(verify({ ...request('1301'), nowSeconds: 1301 }).ok, true);
  assert.equal(verify({ ...request(), nowSeconds: 1301 }).reason, 'expired');
});
test('No consumo capacidad con una firma inválida', () => {
  const verify = createWebhookVerifier({ secret, maxEntries: 1 });
  assert.equal(verify({ ...request(), signature: 'sha256=' + '0'.repeat(64) }).ok, false);
  assert.equal(verify(request()).ok, true);
});
test('No permito evadir la repetición agregando saltos de línea a la firma', () => {
  const verify = createWebhookVerifier({ secret });
  assert.equal(verify(request()).ok, true);
  for (const suffix of ['\n', '\r', '\r\n', '\u2028', '\u2029']) {
    assert.equal(verify({ ...request(), signature: request().signature + suffix }).reason, 'invalid_signature');
  }
  assert.equal(verify(request()).reason, 'replay');
});
test('Conservo la repetición en el borde exacto de expiración', () => {
  const verify = createWebhookVerifier({ secret });
  assert.equal(verify(request()).ok, true);
  assert.equal(verify({ ...request(), nowSeconds: 1300 }).reason, 'replay');
  assert.equal(verify({ ...request(), nowSeconds: 1301 }).reason, 'expired');
});
test('Explicito que el estado de repetición no se comparte entre instancias', () => {
  assert.equal(createWebhookVerifier({ secret })(request()).ok, true);
  assert.equal(createWebhookVerifier({ secret })(request()).ok, true);
});
