const HOURS_FROM_EIGHT_SECONDS = 8 / 3600;
const DANIEL_CURVE_PIVOT_YEAR = 2025.2468;

const toDecimalYear = (dateString) => {
  const year = Number(dateString.slice(0, 4));
  const dateMs = Date.parse(`${dateString}T00:00:00Z`);
  const yearStartMs = Date.UTC(year, 0, 1);
  const nextYearStartMs = Date.UTC(year + 1, 0, 1);

  return year + ((dateMs - yearStartMs) / (nextYearStartMs - yearStartMs));
};

export const danielCurveHoursFromDecimalYear = (decimalYear) => {
  const tau = decimalYear - DANIEL_CURVE_PIVOT_YEAR;

  const g = tau <= 0
    ? 6.935959 + (2.362717 * tau) + (0.196760 * (tau ** 2))
    : 6.935959 + (3.053947 * tau) + (0.154071 * (Math.exp(1.904861 * tau) - 1));

  return (2 ** g) / 450;
};

export const danielCurveHoursForDate = (dateString) =>
  danielCurveHoursFromDecimalYear(toDecimalYear(dateString));

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

export const TODAY_REFERENCE_DATE = '2026-04-10';

export const METR_PROGRESS_DOMAIN = {
  startDate: '2021-01-01',
  endDate: '2027-01-01',
  minHours: HOURS_FROM_EIGHT_SECONDS,
  maxHours: 256,
};

// Published METR points use p80 horizons from METR Horizon v1.1, converted from minutes to hours.
export const PUBLISHED_METR_P80_POINTS = [
  { id: 'gpt-4', label: 'GPT-4', releaseDate: '2023-03-14', hours: 0.0148, showLabel: true, labelDx: 6, labelDy: -6 },
  { id: 'gpt-4-turbo-nov', label: 'GPT-4 Turbo (Nov 2023)', releaseDate: '2023-11-06', hours: 0.0131 },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', releaseDate: '2024-03-04', hours: 0.0106 },
  { id: 'gpt-4-turbo-apr', label: 'GPT-4 Turbo (Apr 2024)', releaseDate: '2024-04-09', hours: 0.0155 },
  { id: 'gpt-4o', label: 'GPT-4o', releaseDate: '2024-05-13', hours: 0.0211, showLabel: true, labelDx: 6, labelDy: -6 },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', releaseDate: '2024-06-20', hours: 0.0279 },
  { id: 'o1-preview', label: 'o1-preview', releaseDate: '2024-09-12', hours: 0.0737 },
  { id: 'claude-3-5-sonnet-oct', label: 'Claude 3.5 Sonnet (Oct 2024)', releaseDate: '2024-10-22', hours: 0.0433 },
  { id: 'o1', label: 'o1', releaseDate: '2024-12-05', hours: 0.1182, showLabel: true, labelDx: 6, labelDy: 14 },
  { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', releaseDate: '2025-02-24', hours: 0.2015 },
  { id: 'o3', label: 'o3', releaseDate: '2025-04-16', hours: 0.4997, showLabel: true, labelDx: 6, labelDy: -6 },
  { id: 'claude-opus-4', label: 'Claude Opus 4', releaseDate: '2025-05-22', hours: 0.3405 },
  { id: 'claude-opus-4-1', label: 'Claude Opus 4.1', releaseDate: '2025-08-05', hours: 0.3909 },
  { id: 'gpt-5', label: 'GPT-5', releaseDate: '2025-08-07', hours: 0.6385, showLabel: true, labelDx: 6, labelDy: -6 },
  { id: 'gemini-3-pro', label: 'Gemini 3 Pro', releaseDate: '2025-11-18', hours: 0.9024 },
  { id: 'gpt-5-1-codex-max', label: 'GPT-5.1 Codex Max', releaseDate: '2025-11-19', hours: 0.8439 },
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5', releaseDate: '2025-11-24', hours: 0.8238 },
  { id: 'gpt-5-2', label: 'GPT-5.2', releaseDate: '2025-12-11', hours: 1.1 },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', releaseDate: '2026-02-05', hours: 1.1646, showLabel: true, labelDx: 8, labelDy: -10 },
  { id: 'gpt-5-3-codex', label: 'GPT-5.3 Codex', releaseDate: '2026-02-05', hours: 0.9123 },
  { id: 'gpt-5-4', label: 'GPT-5.4', releaseDate: '2026-03-05', hours: 0.898, showLabel: true, labelDx: 8, labelDy: 16 },
];

export const ECI_EXTRAPOLATED_P80_POINTS = [
  {
    id: 'gpt-5-4-pro',
    label: 'GPT-5.4 Pro extrap.',
    releaseDate: '2026-03-05',
    hours: 2.3981,
    eci: 157.9435,
    note: 'Official Epoch ECI for GPT-5.4 Pro, mapped to METR p80 using the published overlap fit.',
    labelDx: 8,
    labelDy: 18,
  },
  {
    id: 'claude-mythos-preview',
    label: 'Mythos extrap.',
    releaseDate: '2026-04-08',
    hours: 3.9488,
    eci: 161,
    note: 'Uses an assumed ECI of 161 for Mythos Preview rather than an official Epoch listing.',
    labelDx: 8,
    labelDy: 16,
  },
];

export const DANIEL_CURVE_P80_SERIES = buildDanielCurveSeries(
  METR_PROGRESS_DOMAIN.startDate,
  METR_PROGRESS_DOMAIN.endDate,
);

export const METR_PROGRESS_SNAPSHOT = {
  danielCurveToday: {
    label: "Daniel's curve",
    hours: danielCurveHoursForDate(TODAY_REFERENCE_DATE),
  },
  bestPublished: {
    label: 'Claude Opus 4.6',
    hours: 1.1646,
  },
  gpt54Actual: {
    label: 'GPT-5.4',
    hours: 0.898,
  },
  gpt54ProExtrapolation: {
    label: 'GPT-5.4 Pro',
    hours: 2.3981,
  },
  mythosExtrapolation: {
    label: 'Claude Mythos Preview',
    hours: 3.9488,
    eci: 161,
  },
};
