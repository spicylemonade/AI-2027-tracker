import test from 'node:test';
import assert from 'node:assert/strict';
import calibration from '../src/data/metrCalibration.js';
import { fitLogHorizon, predictHorizon } from '../src/data/metrFit.js';
import {
  ECI_CALIBRATION_POINTS, ECI_EXTRAPOLATED_P80_POINTS, ECI_FIT,
  METR_PROGRESS_SNAPSHOT, PUBLISHED_METR_P80_POINTS, RECENT_ECI_FIT,
  DANIEL_CURVE_P80_SERIES, TODAY_REFERENCE_DATE,
} from '../src/data/metrProgress.js';

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('log fit recovers an independently specified exponential relationship', () => {
  const fit = fitLogHorizon([1, 2, 3, 4].map(eci => ({ eci, hours: 3 * 2 ** eci })));
  close(fit.intercept, Math.log(3));
  close(fit.slope, Math.log(2));
  close(fit.rSquared, 1);
  close(predictHorizon(fit, 6), 192);
});

test('invalid fit inputs fail rather than generating a misleading estimate', () => {
  assert.throws(() => fitLogHorizon([]));
  assert.throws(() => fitLogHorizon([1, 2, 3].map(eci => ({ eci, hours: 0 }))));
  assert.throws(() => fitLogHorizon([1, 2, 3].map(hours => ({ eci: 1, hours }))));
  assert.throws(() => predictHorizon(ECI_FIT, NaN));
});

test('published p80 preserves source units and contains no converted Sol result', () => {
  const mythos = PUBLISHED_METR_P80_POINTS.find(p => p.id === 'claude_mythos_preview_early_inspect');
  close(mythos.hours, 185.911829 / 60);
  close(mythos.ciLowHours, 97.30292 / 60);
  close(mythos.ciHighHours, 398.514614 / 60);
  assert.equal(METR_PROGRESS_SNAPSHOT.bestPublished.id, mythos.id);
  assert.ok(!PUBLISHED_METR_P80_POINTS.some(p => /Sol/.test(p.label)));
  for (const p of PUBLISHED_METR_P80_POINTS) {
    assert.ok(p.hours > 0 && p.ciLowHours <= p.hours && p.ciHighHours >= p.hours);
    assert.ok(p.releaseDate <= TODAY_REFERENCE_DATE);
  }
});

test('calibration uses unique, explicit model matches from a single Epoch snapshot', () => {
  assert.equal(ECI_CALIBRATION_POINTS.length, 20);
  assert.equal(new Set(ECI_CALIBRATION_POINTS.map(p => p.epochModel)).size, 20);
  assert.ok(calibration.excludedFromCalibration.some(p => p.id === 'gpt_5_3_codex'));
  assert.ok(!ECI_CALIBRATION_POINTS.some(p => /Mythos|Sol|Codex Max/.test(p.label)));
  for (const p of ECI_CALIBRATION_POINTS) {
    assert.equal(p.eci, calibration.epoch.find(row => row.model === p.epochModel).eci);
  }
  assert.equal(TODAY_REFERENCE_DATE, calibration.asOf);
});

test('current fit matches an independent Python calculation and exposes sensitivity', () => {
  close(ECI_FIT.slope, 0.14432843914462962);
  close(ECI_FIT.intercept, -22.204412874375198);
  close(ECI_FIT.rSquared, 0.9707683271894857);
  const astra = ECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'GPT-6 Astra');
  close(astra.hours, 8.999745793830106);
  close(astra.eciInputLowHours, 5.913279437585213);
  close(astra.eciInputHighHours, 14.303304885837715);
  close(astra.recentFitHours, 4.234995082357844);
  assert.equal(astra.ciLevel, 0.90);
  assert.equal(RECENT_ECI_FIT.n, 11);
  assert.equal(METR_PROGRESS_SNAPSHOT.frontierExtrapolation, astra);
  assert.ok(astra.eci > ECI_FIT.maxEci);
});

test('published and extrapolated series remain distinct and curve is finite in its displayed domain', () => {
  for (const p of ECI_EXTRAPOLATED_P80_POINTS) {
    assert.equal(p.eciSource, 'epoch-eci');
    assert.ok(p.eciInputLowHours < p.hours && p.hours < p.eciInputHighHours);
  }
  assert.ok(!ECI_EXTRAPOLATED_P80_POINTS.some(p => /Mythos/.test(p.model)));
  for (const p of DANIEL_CURVE_P80_SERIES) assert.ok(Number.isFinite(p.hours) && p.hours > 0);
});
