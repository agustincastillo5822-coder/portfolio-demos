import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsv, summarizeCsv } from '../src/csv.mjs';

const header = 'id,category,quantity,unit_price\n';
test('Agrego mis datos de ejemplo y separo duplicados e importes inválidos', async () => {
  const result = summarizeCsv(await readFile(new URL('../fixtures/orders.csv', import.meta.url), 'utf8'));
  assert.deepEqual(result.totals, { rows: 4, rejected: 2, quantity: 8, totalCents: 47175 });
  assert.deepEqual(result.categories.map(v => v.category), ['Automatizacion', 'Contenido, editorial', 'Datos']);
  assert.deepEqual(result.rejected, [{ record: 6, errors: ['duplicate_id'] }, { record: 7, errors: ['invalid_quantity'] }]);
});
test('Leo comillas escapadas, comas, BOM, campos vacíos y saltos citados', () => {
  assert.deepEqual(parseCsv('\uFEFFa,"b,b","d""e"\r\n1,"dos\ntres",\r\n'), [['a', 'b,b', 'd"e'], ['1', 'dos\ntres', '']]);
  assert.deepEqual(parseCsv('""'), [['']]);
  assert.deepEqual(parseCsv('a\rb'), [['a'], ['b']]);
  assert.deepEqual(parseCsv(''), []);
});
for (const input of ['a,"b', 'a,b"c', 'a,"b"oops', 'a,"b" "c"']) {
  test(`Rechazo comillas mal formadas: ${JSON.stringify(input)}`, () => assert.throws(() => parseCsv(input), SyntaxError));
}
test('Valido tipo, tamaño de entrada, campos y cantidad de registros', () => {
  assert.throws(() => parseCsv(null), TypeError);
  assert.throws(() => parseCsv('a'.repeat(1_000_001)), RangeError);
  assert.throws(() => parseCsv('a'.repeat(4001)), RangeError);
  assert.throws(() => parseCsv('a\n'.repeat(10_002)), RangeError);
});
test('Exijo encabezado exacto y admito un archivo sin datos', () => {
  for (const input of ['', 'id,category,unit_price,quantity', 'id,category,quantity,unit_price,extra']) assert.throws(() => summarizeCsv(input), TypeError);
  assert.equal(summarizeCsv(header).totals.rows, 0);
});
test('Calculo centavos sin errores de coma flotante y acepto precio cero', () => {
  const result = summarizeCsv(header + 'A,Datos,3,0.10\nB,Datos,2,0.2\nC,Datos,1,0');
  assert.equal(result.totals.totalCents, 70);
  assert.equal(result.categories[0].totalCents, 70);
});
for (const [row, code] of [
  ['A,Datos,1,2,extra', 'column_count'], ['A,Datos', 'column_count'],
  ['bad id,Datos,1,2', 'invalid_id'], ['A,   ,1,2', 'invalid_category'],
  ['A,"dos\nlineas",1,2', 'invalid_category'], ['A,Datos,0,2', 'invalid_quantity'],
  ['A,Datos,1.5,2', 'invalid_quantity'], ['A,Datos,1e2,2', 'invalid_quantity'],
  ['A,Datos,100001,2', 'invalid_quantity'], ['A,Datos,01,2', 'invalid_quantity'],
  ['A,Datos,1,1.005', 'invalid_price'], ['A,Datos,1,-1', 'invalid_price'],
  ['A,Datos,1,NaN', 'invalid_price'], ['A,Datos,1,1000000', 'invalid_price'],
  ['"A\n",Datos,1,2', 'invalid_id'], ['A,Datos,"1\n",2', 'invalid_quantity'],
  ['A,Datos,1,"2\n"', 'invalid_price'],
]) test(`Detecto ${code} en ${JSON.stringify(row)}`, () => assert.ok(summarizeCsv(header + row).rejected[0].errors.includes(code)));
test('Conservo la primera aparición válida de un identificador', () => {
  const result = summarizeCsv(header + 'A,Datos,0,1\nA,Datos,1,2\nA,Datos,1,3');
  assert.equal(result.accepted.length, 1);
  assert.equal(result.totals.totalCents, 200);
});
test('Mantengo categorías como __proto__ sin alterar objetos', () => {
  const result = summarizeCsv(header + 'A,__proto__,1,2\nB,constructor,1,3');
  assert.equal(result.categories.length, 2);
  assert.equal(result.totals.totalCents, 500);
});
test('Rechazo una fila que desbordaría el total entero seguro', () => {
  const rows = Array.from({ length: 902 }, (_, i) => `A${i},Datos,100000,999999.99`).join('\n');
  const result = summarizeCsv(header + rows);
  assert.ok(result.rejected.some(v => v.errors.includes('total_overflow')));
  assert.ok(Number.isSafeInteger(result.totals.totalCents));
});
