const HEADER = ['id', 'category', 'quantity', 'unit_price'];
const MAX_CHARS = 1_000_000;
const MAX_RECORDS = 10_001;
const MAX_FIELD = 4_000;

export function parseCsv(input) {
  if (typeof input !== 'string') throw new TypeError('CSV must be text');
  if (input.length > MAX_CHARS) throw new RangeError('CSV exceeds 1000000 characters');
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  const endField = () => { row.push(field); field = ''; closed = false; };
  const endRow = () => {
    endField(); rows.push(row); row = [];
    if (rows.length > MAX_RECORDS) throw new RangeError('CSV exceeds 10001 records');
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += ch;
    } else if (ch === ',') endField();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else if (ch === '"' && field === '' && !closed) quoted = true;
    else {
      if (closed || ch === '"') throw new SyntaxError('Malformed CSV quoting');
      field += ch;
    }
    if (field.length > MAX_FIELD) throw new RangeError('CSV field exceeds 4000 characters');
  }
  if (quoted) throw new SyntaxError('Unclosed CSV quote');
  if (field !== '' || row.length > 0 || closed) endRow();
  return rows;
}

export function summarizeCsv(input) {
  const [header, ...rows] = parseCsv(input);
  if (!header || header.length !== HEADER.length || header.some((v, i) => v !== HEADER[i])) {
    throw new TypeError('Expected header: id,category,quantity,unit_price');
  }
  const accepted = [], rejected = [], categories = new Map(), seen = new Set();
  let quantity = 0, totalCents = 0;
  for (const [index, fields] of rows.entries()) {
    const record = index + 2;
    const [id, rawCategory, rawQuantity, price] = fields;
    const errors = [];
    if (fields.length !== 4) errors.push('column_count');
    if (!/^[A-Za-z0-9_-]{1,40}(?![\s\S])/.test(id ?? '')) errors.push('invalid_id');
    if (seen.has(id)) errors.push('duplicate_id');
    const category = (rawCategory ?? '').trim();
    if (!category || category.length > 80 || /[\x00-\x1f\x7f]/.test(category)) errors.push('invalid_category');
    const units = Number(rawQuantity);
    if (!/^[1-9]\d{0,5}(?![\s\S])/.test(rawQuantity ?? '') || units > 100_000) errors.push('invalid_quantity');
    let unitPriceCents = 0;
    if (!/^(0|[1-9]\d{0,5})(\.\d{1,2})?(?![\s\S])/.test(price ?? '')) errors.push('invalid_price');
    else {
      const [whole, decimals = ''] = price.split('.');
      unitPriceCents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
    }
    const rowTotal = units * unitPriceCents;
    if (errors.length === 0 && (!Number.isSafeInteger(rowTotal) || !Number.isSafeInteger(totalCents + rowTotal))) {
      errors.push('total_overflow');
    }
    if (errors.length) { rejected.push({ record, errors }); continue; }
    seen.add(id);
    accepted.push({ id, category, quantity: units, unitPriceCents, totalCents: rowTotal });
    const group = categories.get(category) ?? { category, rows: 0, quantity: 0, totalCents: 0 };
    group.rows++; group.quantity += units; group.totalCents += rowTotal;
    categories.set(category, group);
    quantity += units; totalCents += rowTotal;
  }
  return {
    accepted, rejected,
    totals: { rows: accepted.length, rejected: rejected.length, quantity, totalCents },
    categories: [...categories.values()].sort((a, b) => a.category < b.category ? -1 : a.category > b.category ? 1 : 0),
  };
}
