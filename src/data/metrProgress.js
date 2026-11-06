import calibration from './metrCalibration.js';
import { fitLogHorizon, predictHorizon } from './metrFit.js';
import { predictionEnvelope } from './horizonUncertainty.js';

const HOURS_FROM_EIGHT_SECONDS = 8 / 3600;
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

// Legacy reconstruction retained for comparison. The repository does not contain
// the original source coordinates or a validated fit; this is not a fitted METR trend.
// The chart continues this formula beyond its original window as a mathematical
// extrapolation. Evaluate in log space so that enormous horizons stay drawable.
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

const buildDanielCurveSeries = (startDate, endDate, steps = 216) => {
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const date = new Date(startMs + ((endMs - startMs) * t));
    const releaseDate = date.toISOString().slice(0, 10);

    return {
      releaseDate,
      hours: danielCurveHoursForDate(releaseDate),
    };
  });
};

export const TODAY_REFERENCE_DATE = calibration.asOf;

export const METR_PROGRESS_DOMAIN = {
  startDate: '2021-01-30',
  endDate: '2027-04-27',
  minHours: HOURS_FROM_EIGHT_SECONDS,
  maxHours: 9600,
};

// Preserve source precision; convert minutes to hours exactly once.
const labelOffsets = {
  gpt_4: [6, -6],
  gpt_4o_inspect: [6, -6],
  o1_inspect: [6, 14],
  o3_inspect: [6, -6],
  gpt_5_2025_08_07_inspect: [6, -6],
  claude_opus_4_6_inspect: [-84, -10],
  gpt_5_4: [8, 16],
  claude_mythos_preview_early_inspect: [-118, -30],
};
const chartLabels = {
  gpt_4: 'GPT-4',
  gpt_4o_inspect: 'GPT-4o',
  claude_opus_4_6_inspect: 'Opus 4.6',
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

export const ECI_CALIBRATION_POINTS = PUBLISHED_METR_P80_POINTS
  .filter(point => point.releaseDate >= '2023-01-01' && point.epochModel)
  .map(point => ({
    ...point,
    eci: calibration.epoch.find(row => row.model === point.epochModel).eci,
  }));

export const ECI_FIT = fitLogHorizon(ECI_CALIBRATION_POINTS);
export const RECENT_ECI_FIT = fitLogHorizon(
  ECI_CALIBRATION_POINTS.filter(point => point.releaseDate >= '2025-01-01'),
);

// Use one dated Epoch scale for both calibration and extrapolation.
// AECI and the old assumed Mythos score are not interchangeable inputs.
const extrapolationModels = [
  { model: 'GPT-5.4 Pro', label: 'GPT-5.4 Pro extrap.', labelDx: -112, labelDy: -8 },
  { model: 'GPT-5.6 Sol', label: 'Sol ECI extrap.', labelDx: -92, labelDy: 18 },
  { model: 'Claude Opus 5', label: 'Opus 5 extrap.', labelDx: 8, labelDy: 32 },
  { model: 'GPT-6 Astra', label: 'Astra extrap.', labelDx: 10, labelDy: -8 },
];

export const ECI_EXTRAPOLATED_P80_POINTS = extrapolationModels.map(({ model, ...display }) => {
  const row = calibration.epoch.find(point => point.model === model);
  return {
    ...row,
    ...display,
    id: `${model.toLowerCase().replaceAll(' ', '-')}-extrap`,
    eciSource: 'epoch-eci',
    hours: predictHorizon(ECI_FIT, row.eci),
    uncertainty: predictionEnvelope(ECI_FIT, row.eci, {
      low: row.ciLow, high: row.ciHigh, inputLevel: row.ciLevel,
    }),
    // These are transformed Epoch 90% ECI endpoints with the fit held fixed.
    // They omit calibration error and are NOT a horizon confidence interval.
    eciInputLowHours: predictHorizon(ECI_FIT, row.ciLow),
    eciInputHighHours: predictHorizon(ECI_FIT, row.ciHigh),
    recentFitHours: predictHorizon(RECENT_ECI_FIT, row.eci),
  };
});

export const DANIEL_CURVE_P80_SERIES = buildDanielCurveSeries(
  METR_PROGRESS_DOMAIN.startDate,
  METR_PROGRESS_DOMAIN.endDate,
);

export const METR_PROGRESS_SNAPSHOT = {
  danielCurveToday: {
    label: "Daniel's curve (approx.)",
    hours: danielCurveHoursForDate(TODAY_REFERENCE_DATE),
  },
  bestPublished: PUBLISHED_METR_P80_POINTS.reduce((best, point) =>
    point.hours > best.hours ? point : best),
  latestExtrapolation: ECI_EXTRAPOLATED_P80_POINTS.reduce((latest, point) =>
    point.releaseDate > latest.releaseDate ? point : latest),
};
