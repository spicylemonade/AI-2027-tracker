import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDanielCurveForViewport, danielCurveHoursForDate,
  danielCurveLog10HoursForTimestamp, METR_PROGRESS_DOMAIN,
} from '../src/data/metrProgress.js';
import { buildHorizonTicks, normalizeViewport } from '../src/data/chartViewport.js';

const viewport = (start, end, yMinLog, yMaxLog) => ({
  xMin: Date.parse(start), xMax: Date.parse(end), yMinLog, yMaxLog,
});
const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('log-space curve preserves existing values, including leap dates', () => {
  for (const date of ['2021-01-30', '2024-02-29', '2026-09-07', '2027-04-27']) {
    close(danielCurveLog10HoursForTimestamp(Date.parse(date)), Math.log10(danielCurveHoursForDate(date)));
  }
  close(danielCurveHoursForDate('2026-09-07'), 18.582492927182283);
});

test('curve follows the visible date range beyond the original endpoint', () => {
  const bounds = viewport('2027-04-27', '2028-06-01', 0, 20);
  const points = buildDanielCurveForViewport(bounds);
  assert.equal(points.length, 257);
  assert.equal(points[0].timestamp, bounds.xMin);
  assert.equal(points.at(-1).timestamp, bounds.xMax);
  assert.ok(points.at(-1).timestamp > Date.parse(METR_PROGRESS_DOMAIN.endDate));
  for (let i = 1; i < points.length; i++) assert.ok(points[i].logHours > points[i - 1].logHours);
});

test('visible crossings are found without drawing flattened lines along the edges', () => {
  const bounds = viewport('2000-01-01', '2100-01-01', 0, 6);
  const points = buildDanielCurveForViewport(bounds);
  close(points[0].logHours, bounds.yMinLog);
  close(points.at(-1).logHours, bounds.yMaxLog);
  assert.ok(points[0].timestamp > bounds.xMin && points.at(-1).timestamp < bounds.xMax);
  for (const point of points) close(point.logHours, danielCurveLog10HoursForTimestamp(point.timestamp));
  assert.ok(points.slice(1, -1).every(p => p.logHours > 0 && p.logHours < 6));
  assert.deepEqual(buildDanielCurveForViewport(viewport('2026-01-01', '2027-01-01', 100, 200)), []);
});

test('future horizons beyond numeric hour overflow still have a drawable curve and axis', () => {
  assert.equal(danielCurveHoursForDate('2035-01-01'), Infinity);
  close(danielCurveLog10HoursForTimestamp(Date.parse('2035-01-01')), 7875.993134118867, 1e-6);
  const bounds = normalizeViewport(viewport('2035-01-01', '2036-01-01', 7000, 20000));
  assert.equal(bounds.yMaxLog, 20000);
  const points = buildDanielCurveForViewport(bounds);
  assert.equal(points.length, 257);
  assert.ok(points.every(p => Number.isFinite(p.timestamp) && Number.isFinite(p.logHours)));
  const ticks = buildHorizonTicks(bounds.yMinLog, bounds.yMaxLog);
  assert.ok(ticks.length > 1 && ticks.every(t => Number.isFinite(t.logHours) && t.hours === null));
  assert.ok(buildHorizonTicks(-12, 12).every(t => t.label !== '0 sec'));
});

test('sampling handles extended ISO years and rejects invalid bounds', () => {
  const bounds = viewport('+010000-01-01', '+010001-01-01', -1e40, 1e40);
  const points = buildDanielCurveForViewport(bounds);
  assert.equal(points.length, 257);
  assert.ok(points.every(p => Number.isFinite(p.logHours)));
  assert.ok(points.at(-1).logHours > points[0].logHours);
  assert.throws(() => buildDanielCurveForViewport({ ...bounds, xMax: bounds.xMin }));
  assert.throws(() => buildDanielCurveForViewport(bounds, 0));
});
