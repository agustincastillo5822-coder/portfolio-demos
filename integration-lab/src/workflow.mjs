const STATES = new Set(['pending', 'running', 'waiting_retry', 'succeeded', 'failed', 'cancelled']);
const TERMINAL = new Set(['succeeded', 'failed', 'cancelled']);

function validate(state) {
  if (!state || typeof state !== 'object' || typeof state.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}(?![\s\S])/.test(state.id) ||
      !STATES.has(state.status) || !Number.isSafeInteger(state.maxAttempts) || state.maxAttempts < 1 || state.maxAttempts > 10 ||
      !Number.isSafeInteger(state.attempts) || state.attempts < 0 || state.attempts > state.maxAttempts ||
      !Number.isSafeInteger(state.revision) || state.revision < 0 || state.revision < state.attempts) throw new TypeError('Invalid workflow state');
  const needsError = ['waiting_retry', 'failed'].includes(state.status);
  if (needsError ? typeof state.lastError !== 'string' || !state.lastError.trim() || state.lastError.length > 200 : state.lastError !== null) throw new TypeError('Invalid workflow error');
  if ((state.status === 'pending' && (state.attempts !== 0 || state.revision !== 0)) ||
      (['running', 'waiting_retry', 'succeeded', 'failed'].includes(state.status) && state.attempts === 0) ||
      (state.status === 'waiting_retry' && state.attempts >= state.maxAttempts) ||
      (state.status === 'failed' && state.attempts !== state.maxAttempts)) throw new TypeError('Inconsistent workflow state');
}

export function createWorkflow(id, { maxAttempts = 3 } = {}) {
  const state = { id, status: 'pending', attempts: 0, maxAttempts, lastError: null, revision: 0 };
  validate(state);
  return Object.freeze(state);
}

export function transition(state, event) {
  validate(state);
  if (!event || !['start', 'succeed', 'fail', 'cancel'].includes(event.type)) throw new TypeError('Unknown workflow event');
  if (TERMINAL.has(state.status)) throw new Error('Terminal workflow cannot transition');
  if (state.revision === Number.MAX_SAFE_INTEGER) throw new RangeError('Workflow revision overflow');
  let status, attempts = state.attempts, lastError = null;
  switch (event.type) {
    case 'start':
      if (!['pending', 'waiting_retry'].includes(state.status)) throw new Error('Start requires pending or waiting_retry');
      attempts++; status = 'running'; break;
    case 'succeed':
      if (state.status !== 'running') throw new Error('Success requires running');
      status = 'succeeded'; break;
    case 'fail':
      if (state.status !== 'running') throw new Error('Failure requires running');
      if (typeof event.reason !== 'string' || !event.reason.trim() || event.reason.length > 200) throw new TypeError('Failure requires a reason of 1 to 200 characters');
      lastError = event.reason.trim();
      status = attempts >= state.maxAttempts ? 'failed' : 'waiting_retry'; break;
    case 'cancel': status = 'cancelled'; break;
  }
  return Object.freeze({ id: state.id, status, attempts, maxAttempts: state.maxAttempts, lastError, revision: state.revision + 1 });
}
