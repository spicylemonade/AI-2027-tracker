import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fitLogHorizon } from '../src/data/metrFit.js';
import { predictionEnvelope, regressionInterval, studentTCritical } from '../src/data/horizonUncertainty.js';
import { ECI_CALIBRATION_POINTS, ECI_EXTRAPOLATED_P80_POINTS, ECI_FIT } from '../src/data/metrProgress.js';
import { AECI_EXTRAPOLATED_P80_POINTS } from '../src/data/aeciProgress.js';
import { METR_TASK_BOOTSTRAP_AUDIT } from '../src/data/uncertaintyAudit.js';

const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('Student t critical values agree with independent SciPy references', () => {
  for (const [df, p90, p95] of [
    [1, 6.313751514675037, 12.706204736174694],
    [2, 2.9199855803537242, 4.302652729749462],
    [5, 2.015048373333023, 2.5705818356363146],
    [19, 1.7291328115213687, 2.0930240544083087],
    [100, 1.6602343260853392, 1.983971518523552],
  ]) {
    close(studentTCritical(0.9, df), p90);
    close(studentTCritical(0.95, df), p95);
  }
  assert.throws(() => studentTCritical(1, 19));
  assert.throws(() => studentTCritical(0.9, 0));
});

test('Astra prediction limits include the new-model term and match SciPy calculation', () => {
  const point = ECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'GPT-6 Astra');
  const mean = regressionInterval(ECI_FIT, point.eci, { newModel: false });
  const prediction = regressionInterval(ECI_FIT, point.eci);
  close(prediction.lowHours, 4.81403799);
  close(prediction.highHours, 16.82484112);
  close(mean.lowHours, 6.58808553);
  close(mean.highHours, 12.29422781);
  assert.ok(prediction.lowHours < mean.lowHours && prediction.highHours > mean.highHours);
  close(point.uncertainty.lowHours, 3.20480658876148);
  close(point.uncertainty.highHours, 27.164439962419113);
  assert.equal(point.uncertainty.overallCoverage, null);
  assert.equal(point.uncertainty.predictionLevel, 0.9);
  assert.equal(point.uncertainty.inputLevel, 0.9);
});

test('prediction uncertainty grows with extrapolation and is invariant to affine index units', () => {
  const center = regressionInterval(ECI_FIT, ECI_FIT.meanEci);
  const far = regressionInterval(ECI_FIT, 169.23);
  assert.ok(far.standardError > center.standardError);
  const transformed = fitLogHorizon(ECI_CALIBRATION_POINTS.map(p => ({ ...p, eci: p.eci * 2 + 100 })));
  const alternate = regressionInterval(transformed, 169.23 * 2 + 100);
  close(alternate.lowHours, far.lowHours);
  close(alternate.highHours, far.highHours);
});

test('envelope contains all conditional limits throughout the input interval', () => {
  const envelope = predictionEnvelope(ECI_FIT, 145, { low: 130, high: 170, inputLevel: 0.9 });
  for (let x = 130; x <= 170; x += 0.25) {
    const interval = regressionInterval(ECI_FIT, x);
    assert.ok(interval.lowHours >= envelope.lowHours - 1e-10);
    assert.ok(interval.highHours <= envelope.highHours + 1e-10);
  }
  assert.throws(() => predictionEnvelope(ECI_FIT, 145, { low: 150, high: 170 }));
  assert.throws(() => predictionEnvelope(ECI_FIT, 145, { low: 130 }));
});

test('missing AECI input uncertainty stays explicit rather than becoming a zero-width measurement CI', () => {
  const opus = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Claude Opus 5');
  assert.equal(opus.uncertainty.missingInputInterval, true);
  assert.equal(opus.uncertainty.inputLevel, null);
  assert.equal(opus.uncertainty.kind, 'conditional-prediction');
  assert.ok(opus.uncertainty.lowHours < opus.hours && opus.hours < opus.uncertainty.highHours);
  const model4 = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.internal);
  assert.equal(model4.uncertainty.inputLevel, 0.95);
  assert.equal(model4.uncertainty.overallCoverage, null);
});

test('joint task-bootstrap diagnostic preserves its source and checks every published calibration point', () => {
  const audit = METR_TASK_BOOTSTRAP_AUDIT;
  const bytes = gunzipSync(readFileSync(new URL('../docs/data/metr-task-results-2026-09-07.json.gz', import.meta.url)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), audit.source.parsedJsonSha256);
  assert.equal(audit.draws, 10000);
  assert.equal(audit.nModels, 21);
  assert.equal(audit.nFamilies, 79);
  assert.equal(audit.marginalChecks.length, 21);
  assert.ok(audit.maxReconstructionRelativeError < 0.0005);
  for (const point of ECI_CALIBRATION_POINTS) {
    const check = audit.marginalChecks.find(p => p.id === point.id);
    close(check.publishedHours, point.hours);
  }
});
