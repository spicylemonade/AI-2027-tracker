import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AECI_CALIBRATION_POINTS, AECI_EXTRAPOLATED_P80_POINTS,
  AECI_FIT, AECI_SOURCE, ASTRA_ESTIMATE_SENSITIVITY,
  ECI_WITHOUT_METR_FIT,
} from '../src/data/aeciProgress.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import ablation from '../src/data/eciMetrAblation.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('AECI is calibrated on its own scale, with approximate scores explicitly marked', () => {
  assert.equal(AECI_CALIBRATION_POINTS.length, 7);
  assert.ok(AECI_CALIBRATION_POINTS.every(p => p.approximate && p.aeciSource === 'digitized'));
  assert.ok(!AECI_CALIBRATION_POINTS.some(p => /Mythos/.test(p.model)));
  close(AECI_FIT.slope, 0.181744461484547);
  assert.equal(AECI_SOURCE.ciLevel, 0.95);
});

test('AECI estimates use only Claude source scores; Astra sensitivity stays on ECI', () => {
  assert.ok(!AECI_SOURCE.models.some(p => p.model === 'GPT-6 Astra'));
  assert.ok(AECI_EXTRAPOLATED_P80_POINTS.every(p => p.model.startsWith('Claude')));
  assert.ok(!ASTRA_ESTIMATE_SENSITIVITY.some(p => /AECI/.test(p.label)));
  close(ASTRA_ESTIMATE_SENSITIVITY[0].hours, 11.560133545302762);
});

test('reported AECI endpoints differ from absent digitized intervals', () => {
  const opus = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Claude Opus 5');
  close(opus.hours, 9.220075860190484);
  assert.equal(opus.approximate, false);
  assert.ok(opus.inputLowHours < opus.hours && opus.inputHighHours > opus.hours);
  assert.equal(AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Claude Mythos Preview').inputLowHours, null);
});

test('METR ablation preserves its original input and reproduces the saved horizon refit', () => {
  const bytes = gunzipSync(readFileSync(new URL('../docs/data/epoch-eci-input-2026-09-07.csv.gz', import.meta.url)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), ablation.inputSha256);
  assert.equal(ablation.removedMetrObservations, 36);
  close(ECI_WITHOUT_METR_FIT.rSquared, 0.9653385763468364);
  close(ASTRA_ESTIMATE_SENSITIVITY.find(p => p.label === 'Epoch refitted without METR').hours, 11.455392566555787);
});
