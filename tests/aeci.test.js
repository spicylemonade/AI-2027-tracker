import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AECI_CALIBRATION_POINTS, AECI_EXTRAPOLATED_P80_POINTS,
  AECI_FIT, AECI_SOURCE,
} from '../src/data/aeciProgress.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('AECI is calibrated on its own scale, with approximate scores explicitly marked', () => {
  assert.equal(AECI_CALIBRATION_POINTS.length, 8);
  assert.ok(AECI_CALIBRATION_POINTS.every(p => p.approximate && p.aeciSource === 'digitized'));
  assert.equal(AECI_CALIBRATION_POINTS.filter(p => /Mythos/.test(p.model)).map(p => p.model).join(), 'Claude Mythos Preview (early)');
  close(AECI_FIT.slope, 0.1470880061494893);
});

test('AECI estimates cover only Claude models, using one fit', () => {
  assert.ok(!AECI_SOURCE.models.some(p => p.model === 'GPT-6 Astra'));
  assert.deepEqual(AECI_EXTRAPOLATED_P80_POINTS.map(p => p.model), [
    'Claude Mythos Preview', 'Claude Mythos 5', 'Claude Opus 5', 'Claude Mythos 5.1',
    'Anthropic Model 2 (internal)', 'Claude Opus 5.5', 'Anthropic Model 3 (internal)', 'Anthropic Model 4 (internal)',
  ]);
  assert.deepEqual(AECI_EXTRAPOLATED_P80_POINTS.filter(p => p.internal).map(p => p.label), ['Model 2', 'Model 3', 'Model 4']);
  const model4 = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Anthropic Model 4 (internal)');
  close(model4.hours, 36.134689632232394);
  assert.equal(model4.approximate, false);
  const opus55 = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Claude Opus 5.5');
  close(opus55.hours, 19.94578396119229);
  assert.equal(opus55.aeci, 174.56);
  // Independent Python values from the same fit, to two decimals.
  const hours = (label) => AECI_EXTRAPOLATED_P80_POINTS.find(p => p.label === label).hours;
  for (const [label, expected] of [['Mythos Preview', 5.38], ['Mythos 5', 8.34], ['Mythos 5.1', 14.75], ['Model 2', 18.48], ['Model 3', 28.47]]) {
    assert.ok(Math.abs(hours(label) - expected) < 0.01, label);
  }
  for (const p of AECI_EXTRAPOLATED_P80_POINTS) assert.ok(p.low < p.hours && p.hours < p.high);
});
