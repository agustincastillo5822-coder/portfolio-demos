import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflow, transition } from '../src/workflow.mjs';

const start = s => transition(s, { type: 'start' });
const fail = s => transition(s, { type: 'fail', reason: ' Falla sintética ' });
test('Recorro un reintento hasta completar sin mutar el estado anterior', () => {
  const original = createWorkflow('DEMO-001', { maxAttempts: 2 });
  const running = start(original), retry = fail(running), second = start(retry);
  const done = transition(second, { type: 'succeed' });
  assert.deepEqual(done, { id: 'DEMO-001', status: 'succeeded', attempts: 2, maxAttempts: 2, lastError: null, revision: 4 });
  assert.equal(original.status, 'pending');
  assert.equal(retry.lastError, 'Falla sintética');
  assert.equal(second.lastError, null);
  assert.ok(Object.isFrozen(original) && Object.isFrozen(done));
  assert.throws(() => { original.status = 'succeeded'; }, TypeError);
});
test('Agoto mi techo de intentos y no permito un intento adicional', () => {
  let state = createWorkflow('DEMO-001', { maxAttempts: 3 });
  for (let i = 1; i <= 3; i++) {
    state = fail(start(state));
    assert.equal(state.attempts, i);
    assert.equal(state.status, i === 3 ? 'failed' : 'waiting_retry');
  }
  assert.throws(() => start(state), /Terminal/);
});
test('Interpreto maxAttempts como intentos totales, no como reintentos extra', () => {
  assert.equal(fail(start(createWorkflow('DEMO-001', { maxAttempts: 1 }))).status, 'failed');
});
test('Puedo cancelar antes, durante o entre intentos', () => {
  const pending = createWorkflow('DEMO-001');
  for (const source of [pending, start(pending), fail(start(pending))]) {
    const cancelled = transition(source, { type: 'cancel' });
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.lastError, null);
    assert.throws(() => transition(cancelled, { type: 'succeed' }), /Terminal/);
  }
});
test('Rechazo eventos incompatibles y razones vacías', () => {
  const pending = createWorkflow('DEMO-001'), running = start(pending);
  for (const type of ['succeed', 'fail']) assert.throws(() => transition(pending, { type, reason: 'X' }));
  assert.throws(() => start(running));
  for (const reason of ['', '  ', null, 'x'.repeat(201)]) assert.throws(() => transition(running, { type: 'fail', reason }), TypeError);
  for (const event of [null, {}, { type: 'rewind' }]) assert.throws(() => transition(pending, event), TypeError);
});
test('Rechazo identificadores, límites e instantáneas inconsistentes', () => {
  for (const id of ['', 'invalid id', 'DEMO\n', 123, null]) assert.throws(() => createWorkflow(id), TypeError);
  for (const maxAttempts of [0, 11, 1.5, NaN]) assert.throws(() => createWorkflow('DEMO', { maxAttempts }), TypeError);
  const valid = createWorkflow('DEMO');
  for (const patch of [{ status: 'other' }, { attempts: -1 }, { attempts: 4 }, { revision: -1 }, { lastError: 'X' }, { status: 'running' }, { status: 'failed', attempts: 1, revision: 2, lastError: 'X' }, { status: 'waiting_retry', attempts: 3, revision: 6, lastError: 'X' }]) {
    assert.throws(() => transition({ ...valid, ...patch }, { type: 'start' }), TypeError);
  }
});
test('Mantengo resultados deterministas y protejo el contador de revisión', () => {
  const state = start(createWorkflow('DEMO'));
  assert.deepEqual(fail(state), fail(state));
  assert.throws(() => transition({ ...state, revision: Number.MAX_SAFE_INTEGER }, { type: 'succeed' }), RangeError);
});
