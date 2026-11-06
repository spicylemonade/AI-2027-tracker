import aeci from './aeciCalibration.js';
import estimates from './horizonEstimates.js';
import { fitLogHorizon, predictHorizon } from './metrFit.js';
import { PUBLISHED_METR_P80_POINTS } from './metrProgress.js';

export const AECI_SOURCE = aeci;
export const AECI_CALIBRATION_POINTS = aeci.models.filter(p => p.metrId).map(p => ({
  ...p,
  eci: p.aeci, // fitLogHorizon's numerical input; the public scale is AECI.
  hours: PUBLISHED_METR_P80_POINTS.find(m => m.id === p.metrId).hours,
}));
export const AECI_FIT = fitLogHorizon(AECI_CALIBRATION_POINTS);

const aeciDisplay = {
  'Claude Opus 5': { label: 'Opus 5', labelDx: -38, labelDy: -8 },
  'Claude Opus 5.5': { label: 'Opus 5.5', labelDx: 8, labelDy: 8 },
  'Anthropic Model 4 (internal)': { label: 'Model 4 (internal)', labelDx: -92, labelDy: -2 },
};
export const AECI_EXTRAPOLATED_P80_POINTS = aeci.models.filter(p => aeciDisplay[p.model]).map(p => ({
  ...p,
  ...aeciDisplay[p.model],
  id: `${p.model.toLowerCase().replaceAll(' ', '-')}-aeci`,
  hours: predictHorizon(AECI_FIT, p.aeci),
  low: estimates.aeci[p.model].low,
  high: estimates.aeci[p.model].high,
}));
