import calibration from './metrCalibration.js';
import estimates from './horizonEstimates.js';
import { fitLogHorizon, predictHorizon } from './metrFit.js';

const HOURS_FROM_SECONDS = 1 / 3600;

const decimalYearFromTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  if (!Number.isFinite(year)) throw new Error('Curve dates must be valid timestamps.');
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const day = monthDays.slice(0, date.getUTCMonth()).reduce((sum, days) => sum + days, 0)
    + date.getUTCDate() - 1;
  const fraction = (date.getUTCHours() * 3600000 + date.getUTCMinutes() * 60000
    + date.getUTCSeconds() * 1000 + date.getUTCMilliseconds()) / 86400000;
  return year + (day + fraction) / (leap ? 366 : 365);
};

// AI 2027's timelines trajectory, on METR's older TH1.0 scale. Its authors' grading sheet confirms it:
// about 15 min at publication, 231 min at 2026.3, and 279 min at 2026.35. See docs/methodology.md.
// Past that window it is a mathematical continuation. Evaluate in log space so huge horizons stay drawable.
const danielCurveLogSeconds = (decimalYear) => {
  if (!Number.isFinite(decimalYear)) throw new Error('Curve year must be finite.');
  const u = decimalYear - 2025;
  return 6.36588017
    + (1.75547434 * u)
    + (0.350855496 * (u ** 2))
    + (0.0462100721 * (u ** 3))
    + (0.0144760767 * (u ** 4))
    + (0.0194798378 * (u ** 5))
    + (0.00743193880 * (u ** 6))
    + (0.000851343348 * (u ** 7));

};

export const danielCurveHoursFromDecimalYear = (decimalYear) =>
  Math.exp(danielCurveLogSeconds(decimalYear)) * HOURS_FROM_SECONDS;

export const danielCurveLog10HoursForTimestamp = (timestamp) =>
  (danielCurveLogSeconds(decimalYearFromTimestamp(timestamp)) - Math.log(3600)) / Math.LN10;

export const danielCurveHoursForDate = (dateString) =>
  danielCurveHoursFromDecimalYear(decimalYearFromTimestamp(Date.parse(`${dateString}T00:00:00Z`)));

export const buildDanielCurveForViewport = ({ xMin, xMax, yMinLog, yMaxLog }, steps = 256) => {
  if (![xMin, xMax, yMinLog, yMaxLog].every(Number.isFinite) || xMin >= xMax
    || yMinLog >= yMaxLog || !Number.isInteger(steps) || steps < 1) {
    throw new Error('Curve sampling needs finite, ordered bounds and a positive step count.');
  }
  const evaluate = danielCurveLog10HoursForTimestamp;
  const leftValue = evaluate(xMin), rightValue = evaluate(xMax);
  if (leftValue > yMaxLog || rightValue < yMinLog) return [];

  // This polynomial is increasing (its derivative has no real roots). Locate
  // the actual visible crossings first: clamping y samples would draw a false
  // horizontal line, and coarse sampling across centuries could miss the curve.
  const crossing = (target) => {
    let low = xMin, high = xMax;
    for (let i = 0; i < 96; i++) {
      const middle = low + (high - low) / 2;
      if (middle === low || middle === high) break;
      if (evaluate(middle) < target) low = middle;
      else high = middle;
    }
    return high;
  };
  const start = leftValue < yMinLog ? crossing(yMinLog) : xMin;
  const end = rightValue > yMaxLog ? crossing(yMaxLog) : xMax;
  if (end < start) return [];
  return Array.from({ length: steps + 1 }, (_, index) => {
    const timestamp = start + (end - start) * index / steps;
    return { timestamp, logHours: evaluate(timestamp) };
  });
};

export const TODAY_REFERENCE_DATE = calibration.asOf;

// Opens on the period that matters; the view can still pan and zoom beyond it.
export const METR_PROGRESS_DOMAIN = {
  startDate: '2023-01-01',
  endDate: '2027-04-27',
  minHours: 20 * HOURS_FROM_SECONDS,
  maxHours: 1000,
};

// Preserve source precision; convert minutes to hours exactly once.
const labelOffsets = {
  gpt_4: [6, -8],
  o3_inspect: [-16, -8],
  gpt_5_2025_08_07_inspect: [-14, -8],
  claude_mythos_preview_early_inspect: [-73, 1],
};
const chartLabels = {
  gpt_4: 'GPT-4',
  claude_mythos_preview_early_inspect: 'Mythos (early)',
};

export const PUBLISHED_METR_P80_POINTS = calibration.measurements.map(point => ({
  ...point,
  chartLabel: chartLabels[point.id],
  hours: point.p80Minutes.estimate / 60,
  ciLowHours: point.p80Minutes.ci_low / 60,
  ciHighHours: point.p80Minutes.ci_high / 60,
  showLabel: Boolean(labelOffsets[point.id]),
  labelDx: labelOffsets[point.id]?.[0],
  labelDy: labelOffsets[point.id]?.[1],
}));

// The published points are TH1.1, so put the TH1.0 scenario curve on the same scale. Following its
// authors, anchor at Claude 3.7 Sonnet, the best model when AI 2027 was published.
const scenarioAnchor = calibration.measurements.find(point => point.id === 'claude_3_7_sonnet_inspect');
export const SCENARIO_REBASE_FACTOR = (scenarioAnchor.p80Minutes.estimate / 60)
  / danielCurveHoursForDate('2025-04-03');
export const SCENARIO_LOG10_OFFSET = Math.log10(SCENARIO_REBASE_FACTOR);
export const scenarioHoursForDate = (dateString) =>
  danielCurveHoursForDate(dateString) * SCENARIO_REBASE_FACTOR;

export const ECI_CALIBRATION_POINTS = PUBLISHED_METR_P80_POINTS
  .filter(point => point.releaseDate >= '2023-01-01' && point.epochModel)
  .map(point => ({
    ...point,
    eci: calibration.epoch.find(row => row.model === point.epochModel).eci,
  }));

export const ECI_FIT = fitLogHorizon(ECI_CALIBRATION_POINTS);

// Claude models appear on the AECI series instead, so only the non-Anthropic frontier model is shown here.
const extrapolationModels = [
  { model: 'GPT-6 Astra', label: 'GPT-6 Astra', labelDx: 8, labelDy: 14 },
];

export const ECI_EXTRAPOLATED_P80_POINTS = extrapolationModels.map(({ model, ...display }) => {
  const row = calibration.epoch.find(point => point.model === model);
  const { low, high } = estimates.eci[model];
  return {
    ...row,
    ...display,
    id: `${model.toLowerCase().replaceAll(' ', '-')}-extrap`,
    eciSource: 'epoch-eci',
    hours: predictHorizon(ECI_FIT, row.eci),
    low,
    high,
  };
});

export const METR_PROGRESS_SNAPSHOT = {
  danielCurveToday: {
    label: 'AI 2027 scenario',
    hours: scenarioHoursForDate(TODAY_REFERENCE_DATE),
  },
  bestPublished: PUBLISHED_METR_P80_POINTS.reduce((best, point) =>
    point.hours > best.hours ? point : best),
  frontierExtrapolation: ECI_EXTRAPOLATED_P80_POINTS[0],
};
