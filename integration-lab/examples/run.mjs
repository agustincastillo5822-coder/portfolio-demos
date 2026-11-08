import { readFile } from 'node:fs/promises';
import { summarizeCsv } from '../src/csv.mjs';
import { signWebhook, createWebhookVerifier } from '../src/webhook.mjs';
import { createWorkflow, transition } from '../src/workflow.mjs';

const report = summarizeCsv(await readFile(new URL('../fixtures/orders.csv', import.meta.url), 'utf8'));
console.log('Resumo mis datos sintéticos:', JSON.stringify({ totals: report.totals, categories: report.categories, rejected: report.rejected }, null, 2));

const secret = Buffer.alloc(32, 7); // Uso una clave artificial, solo para esta demostración.
const rawBody = Buffer.from('{"id":"DEMO-EVENT-001","type":"order.created"}');
const timestamp = '1800000000';
const signature = signWebhook({ secret, timestamp, rawBody });
const verify = createWebhookVerifier({ secret });
const request = { rawBody, timestamp, signature, nowSeconds: 1800000010 };
console.log('Verifico mi evento sintético:', verify(request));
console.log('Rechazo su repetición:', verify(request));

let state = createWorkflow('DEMO-JOB-001', { maxAttempts: 2 });
const trail = [state];
for (const event of [{ type: 'start' }, { type: 'fail', reason: 'Falla simulada' }, { type: 'start' }, { type: 'succeed' }]) {
  state = transition(state, event); trail.push(state);
}
console.log('Recorro mi flujo de prueba:', JSON.stringify(trail, null, 2));
