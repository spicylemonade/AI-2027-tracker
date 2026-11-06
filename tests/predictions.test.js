import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const predictions = JSON.parse(readFileSync(new URL('../src/data/predictions.json', import.meta.url)));
const scored = predictions.filter(p => p.accuracyScore !== null && p.accuracyScore !== undefined);

// The published rubric (blog post B002) scores in 20% increments.
test('every score is a band of the rubric', () => {
  const offRubric = scored.filter(p => ![0, 20, 40, 60, 80, 100].includes(p.accuracyScore));
  assert.deepEqual(offRubric.map(p => `${p.id}=${p.accuracyScore}`), []);
});

test('status labels agree with scores', () => {
  const allowed = {
    'Confirmed Accurate': [80, 100],
    'Partially Accurate': [40, 60, 80],
    'Inaccurate / Debunked': [0, 20],
    'In Progress / Monitoring': [0, 20, 40, 60, 80, 100],
  };
  for (const p of scored) assert.ok(allowed[p.status]?.includes(p.accuracyScore), `${p.id}: ${p.status} at ${p.accuracyScore}`);
});
