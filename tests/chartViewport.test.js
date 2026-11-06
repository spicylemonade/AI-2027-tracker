import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDateTicks, buildHorizonTicks, panViewport, wheelViewport, zoomViewport } from '../src/data/chartViewport.js';
import { METR_PROGRESS_DOMAIN } from '../src/data/metrProgress.js';

const initial = {
  xMin: Date.parse(METR_PROGRESS_DOMAIN.startDate),
  xMax: Date.parse(METR_PROGRESS_DOMAIN.endDate),
  yMinLog: Math.log10(METR_PROGRESS_DOMAIN.minHours),
  yMaxLog: Math.log10(METR_PROGRESS_DOMAIN.maxHours),
};
const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('panning can leave the starting date and horizon ranges in both directions', () => {
  const next = panViewport(initial, 3, 2);
  assert.ok(next.xMin > initial.xMax);
  assert.ok(next.yMinLog > initial.yMaxLog);
  const previous = panViewport(initial, -3, -2);
  assert.ok(previous.xMax < initial.xMin);
  assert.ok(previous.yMaxLog < initial.yMinLog);
  close(next.xMax - next.xMin, initial.xMax - initial.xMin, 0.01);
  close(next.yMaxLog - next.yMinLog, initial.yMaxLog - initial.yMinLog);
});

test('zoom works beyond both old limits and preserves the point beneath the pointer', () => {
  const anchor = { x: 0.8, y: 0.2 };
  for (const factor of [0.001, 20]) {
    const next = zoomViewport(initial, factor, anchor);
    close(next.xMax - next.xMin, (initial.xMax - initial.xMin) * factor, 0.01);
    close(next.yMaxLog - next.yMinLog, (initial.yMaxLog - initial.yMinLog) * factor);
    close(next.xMin + anchor.x * (next.xMax - next.xMin), initial.xMin + anchor.x * (initial.xMax - initial.xMin), 0.01);
    close(next.yMaxLog - anchor.y * (next.yMaxLog - next.yMinLog), initial.yMaxLog - anchor.y * (initial.yMaxLog - initial.yMinLog));
  }
});

test('wheel pixels, lines and pages normalize consistently; horizontal scrolling pans', () => {
  const anchor = { x: 0.5, y: 0.5 };
  const pixels = wheelViewport(initial, { deltaY: 16 }, anchor, 800, 320);
  const lines = wheelViewport(initial, { deltaY: 1, deltaMode: 1 }, anchor, 800, 320);
  assert.deepEqual(lines, pixels);
  const horizontal = wheelViewport(initial, { deltaX: 800 }, anchor, 800, 320);
  close(horizontal.xMin, initial.xMax, 0.01);
  assert.deepEqual(wheelViewport(initial, { deltaY: 800, shiftKey: true }, anchor, 800, 320), horizontal);
  assert.deepEqual(wheelViewport(initial, { deltaY: 1, deltaMode: 2 }, anchor, 800, 320),
    wheelViewport(initial, { deltaY: 320 }, anchor, 800, 320));
});

test('hundreds of zoom gestures retain finite, ordered, renderable bounds', () => {
  let bounds = initial;
  for (const factor of [0.5, 2]) {
    for (let i = 0; i < 400; i++) bounds = zoomViewport(bounds, factor);
    assert.ok(Object.values(bounds).every(Number.isFinite));
    assert.ok(bounds.xMax > bounds.xMin && bounds.yMaxLog > bounds.yMinLog);
    assert.ok(Number.isFinite(new Date(bounds.xMin).getTime()));
    assert.ok(Number.isFinite(new Date(bounds.xMax).getTime()));
    assert.ok(buildHorizonTicks(bounds.yMinLog, bounds.yMaxLog).every(t =>
      Number.isFinite(t.logHours) && (t.hours === null || (Number.isFinite(t.hours) && t.hours > 0))));
  }
});

test('date and log-axis ticks follow the view into future dates and finer scales', () => {
  for (const [start, end] of [
    ['2030-01-01', '2040-01-01'], ['2026-08-01', '2027-02-01'],
    ['2026-09-01', '2026-09-15'], ['2026-09-07T00:00:00Z', '2026-09-07T02:00:00Z'],
  ]) {
    const min = Date.parse(start), max = Date.parse(end);
    const ticks = buildDateTicks(min, max);
    assert.ok(ticks.length >= 2 && ticks.length <= 10);
    assert.ok(ticks.every(t => t.value >= min && t.value <= max));
    assert.equal(new Set(ticks.map(t => t.label)).size, ticks.length);
  }
  assert.ok(buildDateTicks(Date.parse('2030-01-01'), Date.parse('2040-01-01')).some(t => t.label === '2030'));
  const ticks = buildHorizonTicks(5, 10);
  assert.ok(ticks.length > 1 && ticks.every(t => t.hours >= 1e5 && t.hours <= 1e10));
});
