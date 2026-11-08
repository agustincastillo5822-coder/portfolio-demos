import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_BODY_BYTES = 65_536;
function validateSecret(secret) {
  if (!Buffer.isBuffer(secret) || secret.length < 32) throw new TypeError('Secret must be a Buffer of at least 32 bytes');
}
function validTimestamp(value) {
  return typeof value === 'string' && /^(0|[1-9]\d{0,15})(?![\s\S])/.test(value) && Number.isSafeInteger(Number(value));
}
function digest(secret, timestamp, rawBody) {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest();
}
export function signWebhook({ secret, timestamp, rawBody }) {
  validateSecret(secret);
  if (!validTimestamp(timestamp)) throw new TypeError('Timestamp must be canonical Unix seconds');
  if (!Buffer.isBuffer(rawBody) || rawBody.length > MAX_BODY_BYTES) throw new TypeError('Body must be a Buffer of at most 65536 bytes');
  return `sha256=${digest(secret, timestamp, rawBody).toString('hex')}`;
}

export function createWebhookVerifier({ secret, maxAgeSeconds = 300, maxFutureSkewSeconds = 30, maxEntries = 1000 }) {
  validateSecret(secret);
  for (const [name, value, max] of [['maxAgeSeconds', maxAgeSeconds, 86_400], ['maxFutureSkewSeconds', maxFutureSkewSeconds, 300], ['maxEntries', maxEntries, 100_000]]) {
    if (!Number.isSafeInteger(value) || value < (name === 'maxEntries' ? 1 : 0) || value > max) throw new RangeError(`Invalid ${name}`);
  }
  const key = Buffer.from(secret), seen = new Map();
  let latestNow = -1;
  return function verify({ rawBody, timestamp, signature, nowSeconds = Math.floor(Date.now() / 1000) }) {
    if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0 || nowSeconds < latestNow) return { ok: false, reason: 'invalid_clock' };
    latestNow = nowSeconds;
    if (!Buffer.isBuffer(rawBody) || rawBody.length > MAX_BODY_BYTES) return { ok: false, reason: 'invalid_body' };
    if (!validTimestamp(timestamp)) return { ok: false, reason: 'invalid_timestamp' };
    const eventTime = Number(timestamp);
    if (eventTime < nowSeconds - maxAgeSeconds) return { ok: false, reason: 'expired' };
    if (eventTime - nowSeconds > maxFutureSkewSeconds) return { ok: false, reason: 'future_timestamp' };
    if (typeof signature !== 'string' || !/^sha256=[0-9a-f]{64}(?![\s\S])/.test(signature)) return { ok: false, reason: 'invalid_signature' };
    if (!timingSafeEqual(digest(key, timestamp, rawBody), Buffer.from(signature.slice(7), 'hex'))) return { ok: false, reason: 'invalid_signature' };
    for (const [token, time] of seen) if (time < nowSeconds - maxAgeSeconds) seen.delete(token);
    if (seen.has(signature)) return { ok: false, reason: 'replay' };
    if (seen.size >= maxEntries) return { ok: false, reason: 'replay_store_full' };
    seen.set(signature, eventTime);
    return { ok: true };
  };
}
