const DAY = 86_400_000;
const YEAR = 365.2425 * DAY;
const DATE_LIMIT = 8.64e15 - DAY;

// These guard JavaScript Date / floating-point limits, not the data domain.
const finiteAxis = (min, max, limit, minimumSpan) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    throw new Error('Chart bounds must be finite and ordered.');
  }
  let center = min / 2 + max / 2;
  const precisionSpan = Math.abs(center) * Number.EPSILON * 32;
  const span = Math.min(2 * limit, Math.max(max - min, minimumSpan, precisionSpan));
  center = Math.max(-limit + span / 2, Math.min(limit - span / 2, center));
  return [center - span / 2, center + span / 2];
};

export const normalizeViewport = (bounds) => {
  const [xMin, xMax] = finiteAxis(bounds.xMin, bounds.xMax, DATE_LIMIT, 1);
  // Log coordinates remain finite even when the underlying hours overflow.
  const [yMinLog, yMaxLog] = finiteAxis(bounds.yMinLog, bounds.yMaxLog, 1e100, 1e-10);
  return { xMin, xMax, yMinLog, yMaxLog };
};

export const panViewport = (bounds, xFraction, yFraction) => normalizeViewport({
  xMin: bounds.xMin + xFraction * (bounds.xMax - bounds.xMin),
  xMax: bounds.xMax + xFraction * (bounds.xMax - bounds.xMin),
  yMinLog: bounds.yMinLog + yFraction * (bounds.yMaxLog - bounds.yMinLog),
  yMaxLog: bounds.yMaxLog + yFraction * (bounds.yMaxLog - bounds.yMinLog),
});

export const zoomViewport = (bounds, factor, anchor = { x: 0.5, y: 0.5 }) => {
  if (!(factor > 0) || !Number.isFinite(factor)) throw new Error('Zoom factor must be finite and positive.');
  const px = Math.max(0, Math.min(1, anchor.x));
  const py = Math.max(0, Math.min(1, anchor.y));
  const xRange = bounds.xMax - bounds.xMin;
  const yRange = bounds.yMaxLog - bounds.yMinLog;
  const anchorX = bounds.xMin + px * xRange;
  const anchorY = bounds.yMaxLog - py * yRange;
  // Preserve a representable span even after many consecutive zoom events.
  const nextXRange = Math.max(1, Math.abs(anchorX) * Number.EPSILON * 32, xRange * factor);
  const nextYRange = Math.max(1e-10, Math.abs(anchorY) * Number.EPSILON * 32, yRange * factor);
  return normalizeViewport({
    xMin: anchorX - px * nextXRange,
    xMax: anchorX + (1 - px) * nextXRange,
    yMinLog: anchorY - (1 - py) * nextYRange,
    yMaxLog: anchorY + py * nextYRange,
  });
};

export const wheelViewport = (bounds, { deltaX = 0, deltaY = 0, deltaMode = 0, shiftKey = false, ctrlKey = false }, anchor, width, height) => {
  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? height : 1;
  const dx = deltaX * unit;
  const dy = deltaY * unit;
  if (!ctrlKey && (shiftKey || Math.abs(dx) > Math.abs(dy))) {
    return panViewport(bounds, (shiftKey ? (dy || dx) : dx) / width, 0);
  }
  return zoomViewport(bounds, Math.exp(Math.max(-1.5, Math.min(1.5, dy * 0.0014))), anchor);
};

const niceStep = (target) => {
  const power = 10 ** Math.floor(Math.log10(target));
  const multiple = target / power;
  return (multiple <= 1 ? 1 : multiple <= 2 ? 2 : multiple <= 5 ? 5 : 10) * power;
};
const utcDate = (year, month = 0) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 1);
  return date.getTime();
};

export const buildDateTicks = (min, max, count = 7) => {
  const span = max - min;
  const ticks = [];
  const push = (value, label) => {
    if (value >= min && value <= max && Number.isFinite(value)) ticks.push({ value, label });
  };
  if (span >= 2 * YEAR) {
    const step = Math.max(1, niceStep(span / YEAR / count));
    const first = Math.ceil(new Date(min).getUTCFullYear() / step) * step;
    for (let i = 0; i <= count + 2; i++) {
      const year = first + i * step;
      const value = utcDate(year);
      if (value > max) break;
      push(value, String(year));
    }
  } else if (span >= 90 * DAY) {
    const step = [1, 2, 3, 6].find(months => months >= span / (YEAR / 12) / count) ?? 6;
    const date = new Date(min);
    const first = Math.ceil((date.getUTCFullYear() * 12 + date.getUTCMonth()) / step) * step;
    for (let i = 0; i <= count + 2; i++) {
      const month = first + i * step;
      const value = utcDate(Math.floor(month / 12), ((month % 12) + 12) % 12);
      if (value > max) break;
      push(value, new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
    }
  } else {
    const intervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000,
      60000, 120000, 300000, 900000, 1800000, 3600000, 10800000, 21600000, 43200000, DAY, 2 * DAY, 7 * DAY, 14 * DAY];
    const step = intervals.find(value => value >= span / count) ?? 14 * DAY;
    const first = Math.ceil(min / step) * step;
    for (let i = 0; i <= count + 2; i++) {
      const value = first + i * step;
      if (value > max) break;
      const date = new Date(value);
      const iso = date.toISOString();
      const [calendar, clock] = iso.split('T');
      const label = span >= 7 * DAY
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        : span >= DAY ? `${calendar.slice(-5)} ${clock.slice(0, 5)}`
          : span >= 60000 ? clock.slice(0, 8) : clock.slice(0, 12);
      push(value, label);
    }
  }
  return ticks;
};

export const buildHorizonTicks = (minLog, maxLog, count = 8) => {
  const step = niceStep((maxLog - minLog) / count);
  const first = Math.ceil(minLog / step) * step;
  return Array.from({ length: count + 2 }, (_, i) => first + i * step)
    .filter(logHours => logHours >= minLog && logHours <= maxLog)
    .map(logHours => {
      const hours = logHours >= -307 && logHours <= 307 ? 10 ** logHours : null;
      if (logHours < -6 || logHours > 6) {
        const digits = Math.max(0, Math.min(14, Math.ceil(-Math.log10(step))));
        return { logHours, hours, label: `10^${Number(logHours.toFixed(digits))} h` };
      }
      const multiplier = hours < 1 / 60 ? 3600 : hours < 1 ? 60 : 1;
      const unit = multiplier === 3600 ? 'sec' : multiplier === 60 ? 'min' : 'h';
      const gap = hours * Math.expm1(step * Math.LN10) * multiplier;
      const digits = Math.max(0, Math.min(12, Math.max(
        Math.ceil(-Math.log10(gap)) + 1,
        Math.ceil(-Math.log10(hours * multiplier)) + 1,
      )));
      return { logHours, hours, label: `${(hours * multiplier).toLocaleString('en-US', { maximumFractionDigits: digits })} ${unit}` };
    });
};
