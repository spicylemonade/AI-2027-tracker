const HOURS_FROM_EIGHT_SECONDS = 8 / 3600;
const HOURS_FROM_SECONDS = 1 / 3600;

const toDecimalYear = (dateString) => {
  const year = Number(dateString.slice(0, 4));
  const dateMs = Date.parse(`${dateString}T00:00:00Z`);
  const yearStartMs = Date.UTC(year, 0, 1);
  const nextYearStartMs = Date.UTC(year + 1, 0, 1);

  return year + ((dateMs - yearStartMs) / (nextYearStartMs - yearStartMs));
};

export const danielCurveHoursFromDecimalYear = (decimalYear) => {
  const u = decimalYear - 2025;
  const logSeconds = 6.36588017
    + (1.75547434 * u)
    + (0.350855496 * (u ** 2))
    + (0.0462100721 * (u ** 3))
    + (0.0144760767 * (u ** 4))
    + (0.0194798378 * (u ** 5))
    + (0.00743193880 * (u ** 6))
    + (0.000851343348 * (u ** 7));

  return Math.exp(logSeconds) * HOURS_FROM_SECONDS;
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

export const TODAY_REFERENCE_DATE = '2026-09-07';

export const METR_PROGRESS_DOMAIN = {
  startDate: '2021-01-30',
  endDate: '2027-04-27',
  minHours: HOURS_FROM_EIGHT_SECONDS,
  maxHours: 9600,
};

// Published METR points use p80 horizons from METR Horizon v1.1, converted from minutes to hours.
// Exception: points flagged `derived` have no published p80 and are converted from a published p50
// using the median p80/p50 ratio (0.1969) across all 26 models in METR-Horizon-v1.1. Per-model ratios
// range 0.097-0.426, so a derived point carries real slop on top of whatever CI METR published.
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
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', releaseDate: '2026-02-05', hours: 1.1646, showLabel: true, labelDx: -84, labelDy: -10 },
  { id: 'gpt-5-3-codex', label: 'GPT-5.3 Codex', releaseDate: '2026-02-05', hours: 0.9123 },
  { id: 'gemini-3-1-pro', label: 'Gemini 3.1 Pro', releaseDate: '2026-02-19', hours: 1.4967 },
  { id: 'gpt-5-4', label: 'GPT-5.4', releaseDate: '2026-03-05', hours: 0.898, showLabel: true, labelDx: 8, labelDy: 16 },
  { id: 'claude-mythos-preview-early', label: 'Mythos official', releaseDate: '2026-04-07', hours: 3.0985, showLabel: true, labelDx: 8, labelDy: -10 },
  {
    id: 'gpt-5-6-sol',
    label: 'GPT-5.6 Sol',
    releaseDate: '2026-07-09',
    hours: 13.9804,
    derived: true,
    showLabel: true,
    labelDx: -62,
    labelDy: -22,
    note: 'METR published no p80 for GPT-5.6 Sol. Converted from the 71hr p50 variant (cheating attempts discarded) '
      + 'using the 0.1969 median p80/p50 ratio across METR-Horizon-v1.1. METR states none of its GPT-5.6 Sol numbers '
      + 'are a robust measurement: standard methodology gives 11.3hr p50 (95% CI 5-40hr), the 71hr variant carries a '
      + '95% CI of 13-11400hr, and counting cheating as success exceeds 270hr. Detected cheating rate was higher than '
      + 'any public model METR has evaluated. Note also that METR considers measurements above 16hr unreliable and '
      + 'excludes p50 > 16hr from its own doubling-time fit; 71hr is 4.4x that threshold, so this point would not '
      + 'qualify for METR\'s trend line.',
  },
];

// These points mix two capability scales, deliberately. Earlier points use Epoch's published ECI; later Anthropic
// points use the AECI reported in Anthropic's own system cards. `eciSource` records which.
//
// Why the switch: Epoch's ECI is a composite of 50+ benchmarks that are overwhelmingly short-horizon — single-turn
// QA, math and self-contained coding problems. It carries little long-horizon agentic coding signal, which is
// precisely the capability a METR p80 horizon measures. So ECI increasingly understates frontier models for this
// extrapolation, and the gap widens as models improve at exactly the long-horizon work ECI does not test. Epoch
// understated Opus 5 at 159.38 against Anthropic's AECI of 162.1 when that point was added.
//
// Caveat as of 2026-09-07: Epoch has since refit, and that specific gap has closed — Epoch now scores Opus 5 at
// 162.33, marginally above Anthropic's AECI of 162.1. The short-horizon-benchmark critique of ECI may still hold
// in general, but the numeric evidence originally cited for it no longer does. AECI is a fork of ECI and inherits
// its scale, but Anthropic states the two are not directly comparable; treat cross-scale comparisons here as
// indicative rather than exact.
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
    note: 'Uses an assumed ECI of 161 for Mythos Preview; Epoch has never listed any Mythos model. For reference, '
      + 'Anthropic later reported an AECI of 161.3 (95% CI 157.3-165.4, n=67) for Claude Mythos 5 — a different, later '
      + 'model (released 2026-06-09) to which Mythos Preview was the predecessor. The closeness is suggestive but not '
      + 'evidence; treat the 161 here as an assumption rather than a published figure.',
    labelDx: 8,
    labelDy: 16,
  },
  {
    id: 'claude-opus-5-extrap',
    label: 'Opus 5 extrap.',
    releaseDate: '2026-07-24',
    hours: 4.725,
    eci: 162.1,
    eciSource: 'anthropic-aeci',
    note: 'Uses the AECI point estimate of 162.1 (95% CI 158.0-167.3, n=40) reported in Anthropic\'s Claude Opus 5 '
      + 'system card, mapped to METR p80 using the published overlap fit. The CI spans roughly 2.4-11.0hr p80. '
      + 'Anthropic calls this nominally their highest measured score but statistically indistinguishable from Claude '
      + 'Mythos 5 at 161.3 (95% CI 157.3-165.4, n=67), which is the figure behind the Mythos extrapolation above. '
      + 'Note that Epoch\'s independent ECI for Opus 5 is lower at 159.38 (95% CI 157.25-162.21), which would imply '
      + '3.03hr p80 instead.',
    labelDx: 12,
    labelDy: 44,
  },
  {
    id: 'gpt-6-astra-extrap',
    label: 'Astra extrap.',
    releaseDate: '2026-09-03',
    hours: 15.1245,
    eci: 169.23,
    eciSource: 'epoch-eci',
    note: 'Official Epoch ECI for GPT-6 Astra (169.23, 95% CI 164.85-174.02), the highest Epoch has measured, mapped '
      + 'to METR p80 using the published overlap fit. The CI spans roughly 7.4-33.1hr p80. METR did not evaluate '
      + 'GPT-6 Astra — OpenAI\'s external evaluators were UK AISI, Apollo Research, Gray Swan and SecureBio — so no '
      + 'published time horizon exists to check this against. Note that the widely-quoted 30.9min "time horizon" for '
      + 'Astra is UK AISI\'s no-CoT math metric, which is not METR\'s task horizon and is not comparable to this axis. '
      + 'Anthropic publishes no AECI for competitor models, so this point necessarily uses Epoch\'s scale.',
    labelDx: 10,
    labelDy: 4,
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
    label: 'GPT-5.6 Sol',
    hours: 13.9804,
    derived: true,
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
  latestExtrapolation: {
    label: 'GPT-6 Astra',
    hours: 15.1245,
    eci: 169.23,
  },
};
