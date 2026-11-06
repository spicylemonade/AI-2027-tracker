import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import estimates from '../src/data/horizonEstimates.js';
import {
  ECI_EXTRAPOLATED_P80_POINTS, ECI_FIT, METR_PROGRESS_SNAPSHOT,
  SCENARIO_REBASE_FACTOR, danielCurveHoursFromDecimalYear, danielCurveHoursForDate,
  scenarioHoursForDate,
} from '../src/data/metrProgress.js';
import { AECI_EXTRAPOLATED_P80_POINTS, AECI_FIT } from '../src/data/aeciProgress.js';

const analysis = JSON.parse(readFileSync(new URL('../docs/data/horizon-analysis.json', import.meta.url)));
const close = (a, b, tolerance = 1e-3) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('the JavaScript fits reproduce the Python pipeline', () => {
  close(ECI_FIT.slope, analysis.eci.fit.slope);
  close(ECI_FIT.intercept, analysis.eci.fit.intercept);
  close(AECI_FIT.slope, analysis.aeci.fit.slope);
  close(AECI_FIT.intercept, analysis.aeci.fit.intercept);
  for (const p of ECI_EXTRAPOLATED_P80_POINTS) close(p.hours, estimates.eci[p.model].hours);
  for (const p of AECI_EXTRAPOLATED_P80_POINTS) {
    close(p.hours, estimates.aeci[p.model].hours);
    assert.equal(p.releaseDate, analysis.aeci.estimates[p.model].date);
  }
  close(SCENARIO_REBASE_FACTOR, estimates.scenarioRebaseFactor);
  close(METR_PROGRESS_SNAPSHOT.danielCurveToday.hours, analysis.scenario.hoursAsOf);
});

test('site estimates are the generated ones, as 90% ranges around their central values', () => {
  assert.equal(estimates.level, 0.9);
  assert.equal(estimates.asOf, analysis.asOf);
  for (const group of ['eci', 'aeci']) {
    for (const [model, row] of Object.entries(estimates[group])) {
      assert.deepEqual(row, Object.fromEntries(['hours', 'low', 'high'].map(k => [k, analysis[group].estimates[model][k]])));
      assert.ok(row.low < row.hours && row.hours < row.high);
    }
  }
});

test('Model 4 carries more score error than models measured on more benchmarks', () => {
  const width = (row) => row.high / row.low;
  const { aeci } = estimates;
  assert.ok(width(aeci['Anthropic Model 4 (internal)']) > 2 * width(aeci['Claude Opus 5.5']));
  assert.ok(aeci['Anthropic Model 4 (internal)'].low < analysis.aeci.model4UsingOpus55Error[0]);
  assert.ok(aeci['Anthropic Model 4 (internal)'].high < analysis.aeci.model4WithFullMetrRange[1]);
});

test('every AECI point shown has a generated range and a position against the curve', () => {
  assert.deepEqual(AECI_EXTRAPOLATED_P80_POINTS.map(p => p.model).sort(), Object.keys(estimates.aeci).sort());
  for (const p of AECI_EXTRAPOLATED_P80_POINTS) {
    assert.ok(Number.isFinite(estimates.lagWeeks[`${p.model.replace(' (internal)', '')}, AECI`]), p.model);
  }
});

test('the scenario curve matches its authors, then moves onto TH1.1', () => {
  const minutesAt = (year) => danielCurveHoursFromDecimalYear(year) * 60;
  assert.ok(Math.abs(danielCurveHoursForDate('2025-04-03') * 60 - 15) < 1);
  assert.ok(Math.abs(minutesAt(2026.3) / 231 - 1) < 0.05);
  assert.ok(Math.abs(minutesAt(2026.35) / 279 - 1) < 0.1);
  close(scenarioHoursForDate('2025-04-03') * 60, 12.09, 0.01);
});

// Each of these guards a sentence in the chart's caption, so a refresh that changes it fails here.
test('caption claims still hold', () => {
  const { scenario, backtest, astraSensitivity: s, aeci, frontierBenchmarkCoverage: coverage, indexComparison } = analysis;
  const estimated = Object.keys(scenario.lagWeeks).filter(label => !/measured/.test(label));
  for (const label of estimated) {
    const [ahead, behind] = scenario.lagWeeksFromRange[label];
    const includesCurve = ahead < 0 && behind > 0;
    assert.equal(includesCurve, label !== 'Claude Mythos Preview, AECI', `${label}: ${ahead} to ${behind}`);
  }
  assert.equal(Math.round(scenario.lagWeeks['GPT-6 Astra, ECI']), 5);
  const aeciLags = estimated.filter(label => /AECI/.test(label)).map(label => -scenario.lagWeeks[label]);
  assert.ok(Math.min(...aeciLags) > 0 && Math.min(...aeciLags) <= 1.5);
  assert.equal(Math.max(...aeciLags), -scenario.lagWeeks['Claude Mythos Preview, AECI']);
  assert.equal(Math.round(-scenario.lagWeeks['Claude Mythos Preview, AECI']), 11);
  assert.equal(Math.round(-scenario.lagWeeks['Anthropic Model 4, AECI']), 6);
  const widths = AECI_EXTRAPOLATED_P80_POINTS.map(p => ({ internal: Boolean(p.internal), model: p.model, width: p.high / p.low }));
  assert.ok(Math.min(...widths.filter(p => p.internal).map(p => p.width)) > Math.max(...widths.filter(p => !p.internal).map(p => p.width)));
  assert.equal(widths.reduce((a, b) => (b.width > a.width ? b : a)).model, 'Anthropic Model 4 (internal)');
  close(aeci.measuredMythosEarly, 3.1, 0.01);
  for (const [label, weeks] of Object.entries(scenario.lagWeeksWithAuthorsFactor)) {
    const shift = scenario.lagWeeks[label] - weeks;
    assert.ok(shift > 1.4 && shift < 2.5, `${label} shifted ${shift} weeks`);
  }

  assert.equal(backtest.tests, 12);
  assert.equal(Math.round(backtest.eci.coverageMonteCarlo * backtest.tests), 11);
  assert.equal(backtest.eci.rmseFactor.toFixed(1), '1.4');
  assert.equal(backtest.lastSevenBelowPrediction, 7);
  close(s.withBridgedMythos.mythosActualOverPredicted, 1.45, 0.01);
  const variants = [s.pooledLinear, s.quadratic.hours, s.quadraticWithMythos.hours, s.withBridgedMythos.hours,
    s.last10Models, s.theilSen, s.openAiOnly, s.claudeOnly];
  assert.equal(Math.round(Math.min(...variants)), 4);
  assert.equal(Math.round(Math.max(...variants)), 14);
  assert.equal(aeci.forwardTests.length, 5);
  assert.equal(aeci.forwardTests.filter(t => t.inside).length, 3);

  const gaps = aeci.aeciMinusEci;
  assert.ok(gaps.slice(0, 7).every(g => Math.abs(g.gap) <= 2));
  assert.equal(Math.round(Math.max(...gaps.map(g => g.gap))), 6);
  assert.equal(coverage['GPT-6 Astra'].benchmarks, 24);
  assert.equal(coverage['GPT-6 Astra'].agentic.length, 7);
  assert.ok(['MirrorCode', 'FrontierSWE'].every(b => coverage['GPT-6 Astra'].agentic.includes(b)));
  for (const row of indexComparison.slice(1)) assert.ok(row.looFactor > row.publishedEciSameModels.looFactor);
  for (const model of ['Claude Opus 5', 'Claude Opus 5.5']) {
    const hours = Object.values(aeci.acrossFits).map(f => f.hours[model]).filter(Boolean);
    assert.ok(Math.max(...hours) / Math.min(...hours) < 1.1, model);
  }
});
